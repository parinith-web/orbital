/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

/**
 * H8 — host controls & rematch, executed for real against convex-test's
 * simulated backend (same bar D2c/D3/F1a–F1d/H5 all established: real
 * mutation handlers, real transaction-serialized DB, not a hand-rolled
 * mock of what they *should* do).
 *
 * Run with `npx vitest run convex/gameHostControls.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

/** A room-code room (host_user_id set) with a second player already joined. */
async function createHostedRoomWithGuest(
  t: ReturnType<typeof convexTest>,
  hostSubject: string,
  guestSubject: string,
) {
  const host = t.withIdentity({ subject: hostSubject });
  const guest = t.withIdentity({ subject: guestSubject });

  const created = await host.mutation(api.gameRoomCode.createGameRoom, {});
  if ("error" in created) throw new Error(created.error);

  const joined = await guest.mutation(api.gameRoomCode.joinGameRoomByCode, {
    join_code: created.join_code,
  });
  if ("error" in joined) throw new Error(joined.error);

  return created;
}

/** A plain in-room session with no host_user_id (createSession's own flow). */
async function createHostlessRoomWithTwoMembers(
  t: ReturnType<typeof convexTest>,
  ownerSubject: string,
  memberSubject: string,
  roomId: string,
) {
  const owner = t.withIdentity({ subject: ownerSubject });
  const member = t.withIdentity({ subject: memberSubject });

  await owner.mutation(api.rooms.createRoom, { room_name: "Test Room", room_id: roomId });
  await member.mutation(api.rooms.joinRoom, { room_id: roomId });

  const created = await owner.mutation(api.gameSessions.createSession, { room_id: roomId });
  if ("error" in created) throw new Error(created.error);

  return created;
}

describe("H8 — endSession is host-only when a session has a host", () => {
  test("the host can end their own room-code session", async () => {
    const t = convexTest(schema, modules);
    const { session_id } = await createHostedRoomWithGuest(t, "host_a", "guest_a");

    const result = await t
      .withIdentity({ subject: "host_a" })
      .mutation(api.gameSessions.endSession, { session_id });
    expect(result).toEqual({ success: true, alreadyEnded: false });
  });

  test("a non-host player is rejected", async () => {
    const t = convexTest(schema, modules);
    const { session_id } = await createHostedRoomWithGuest(t, "host_b", "guest_b");

    const result = await t
      .withIdentity({ subject: "guest_b" })
      .mutation(api.gameSessions.endSession, { session_id });
    expect(result).toEqual({ error: "Only the host can end this session" });

    // Confirm it genuinely didn't end.
    const session = await t.query(api.gameSessions.getSessionById, { session_id });
    expect(session?.status).not.toBe("ended");
  });

  test("re-ending an already-ended session is a harmless no-op for anyone, host or not", async () => {
    const t = convexTest(schema, modules);
    const { session_id } = await createHostedRoomWithGuest(t, "host_c", "guest_c");

    await t.withIdentity({ subject: "host_c" }).mutation(api.gameSessions.endSession, { session_id });

    // A non-host re-clicking a stale button after the host's click already
    // landed should see the same idempotent no-op everyone else does, not
    // a permission error for something that's already moot.
    const result = await t
      .withIdentity({ subject: "guest_c" })
      .mutation(api.gameSessions.endSession, { session_id });
    expect(result).toEqual({ success: true, alreadyEnded: true });
  });
});

describe("H8 — endSession keeps the pre-H8 'any current player' rule for hostless sessions", () => {
  test("a plain in-room session (createSession, no host_user_id) can be ended by any member", async () => {
    const t = convexTest(schema, modules);
    const { session_id } = await createHostlessRoomWithTwoMembers(
      t,
      "owner_a",
      "member_a",
      "room_nohost_1",
    );

    // member_a is not the Portal room's owner and never ran createSession
    // themself — exactly the case the pre-H8 "no host concept" rule
    // exists for.
    const result = await t
      .withIdentity({ subject: "member_a" })
      .mutation(api.gameSessions.endSession, { session_id });
    expect(result).toEqual({ success: true, alreadyEnded: false });
  });
});

describe("H8 — host-disconnect-mid-game fallback", () => {
  test("a disconnected host no longer blocks a connected non-host from ending the session", async () => {
    const t = convexTest(schema, modules);
    const { session_id } = await createHostedRoomWithGuest(t, "host_d", "guest_d");

    // Confirm the guest is blocked while the host is still connected.
    const blocked = await t
      .withIdentity({ subject: "guest_d" })
      .mutation(api.gameSessions.endSession, { session_id });
    expect(blocked).toEqual({ error: "Only the host can end this session" });

    // The host's tab crashes / loses network — gamePresence.goOffline is
    // the real disconnect path (F1b), not a hand-patched DB row.
    await t.withIdentity({ subject: "host_d" }).mutation(api.gamePresence.goOffline, {
      session_id,
    });

    const nowAllowed = await t
      .withIdentity({ subject: "guest_d" })
      .mutation(api.gameSessions.endSession, { session_id });
    expect(nowAllowed).toEqual({ success: true, alreadyEnded: false });
  });

  test("the host regains exclusive control immediately on reconnect (no permanent hand-off)", async () => {
    const t = convexTest(schema, modules);
    const { session_id } = await createHostedRoomWithGuest(t, "host_e", "guest_e");

    await t.withIdentity({ subject: "host_e" }).mutation(api.gamePresence.goOffline, {
      session_id,
    });
    // Host reconnects — heartbeat is the real reconnect-liveness signal.
    await t.withIdentity({ subject: "host_e" }).mutation(api.gamePresence.heartbeat, {
      session_id,
    });

    const stillBlocked = await t
      .withIdentity({ subject: "guest_e" })
      .mutation(api.gameSessions.endSession, { session_id });
    expect(stillBlocked).toEqual({ error: "Only the host can end this session" });
  });
});

describe("H8 — rematch = fresh session + fresh leaderboard", () => {
  test("the host can start a rematch after the session ends, carrying host/join_code/capacity forward", async () => {
    const t = convexTest(schema, modules);
    const created = await createHostedRoomWithGuest(t, "host_f", "guest_f");
    const host = t.withIdentity({ subject: "host_f" });

    await host.mutation(api.gameSessions.endSession, { session_id: created.session_id });

    const rematch = await host.mutation(api.gameSessions.rematchSession, {
      session_id: created.session_id,
    });
    if ("error" in rematch) throw new Error(rematch.error);
    expect(rematch.session_id).not.toBe(created.session_id);

    const freshSession = await t.query(api.gameSessions.getSessionById, {
      session_id: rematch.session_id,
    });
    expect(freshSession?.status).toBe("waiting");
    expect(freshSession?.host_user_id).toBe("host_f");
    expect(freshSession?.join_code).toBe(created.join_code);
    expect(freshSession?.current_round).toBe(0);

    // Fresh leaderboard: both players re-enrolled at score 0, not carried
    // over from whatever they'd scored in the ended session.
    const players = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: rematch.session_id,
    });
    expect(players.map((p) => p.user_id).sort()).toEqual(["guest_f", "host_f"]);
    expect(players.every((p) => p.score === 0)).toBe(true);

    // getSessionByRoomId (what GameStage subscribes to) now resolves to
    // the fresh session, not the ended one — this is the "rides on
    // existing Convex realtime subscriptions" broadcast in practice.
    const byRoom = await t.query(api.gameSessions.getSessionByRoomId, {
      room_id: created.room_id,
    });
    expect(byRoom?.session_id).toBe(rematch.session_id);
  });

  test("a non-host is rejected while the host is still connected", async () => {
    const t = convexTest(schema, modules);
    const created = await createHostedRoomWithGuest(t, "host_g", "guest_g");
    await t
      .withIdentity({ subject: "host_g" })
      .mutation(api.gameSessions.endSession, { session_id: created.session_id });

    const result = await t
      .withIdentity({ subject: "guest_g" })
      .mutation(api.gameSessions.rematchSession, { session_id: created.session_id });
    expect(result).toEqual({ error: "Only the host can start a rematch" });
  });

  test("rematching a session that hasn't ended is rejected", async () => {
    const t = convexTest(schema, modules);
    const created = await createHostedRoomWithGuest(t, "host_h", "guest_h");

    const result = await t
      .withIdentity({ subject: "host_h" })
      .mutation(api.gameSessions.rematchSession, { session_id: created.session_id });
    expect(result).toEqual({ error: "This session hasn't ended yet" });
  });

  test("two racing rematch calls both resolve to the same fresh session (idempotent)", async () => {
    const t = convexTest(schema, modules);
    const created = await createHostedRoomWithGuest(t, "host_i", "guest_i");
    const host = t.withIdentity({ subject: "host_i" });
    await host.mutation(api.gameSessions.endSession, { session_id: created.session_id });

    const [first, second] = await Promise.all([
      host.mutation(api.gameSessions.rematchSession, { session_id: created.session_id }),
      host.mutation(api.gameSessions.rematchSession, { session_id: created.session_id }),
    ]);
    if ("error" in first) throw new Error(first.error);
    if ("error" in second) throw new Error(second.error);
    expect(first.session_id).toBe(second.session_id);
    expect([first.alreadyExists, second.alreadyExists].filter(Boolean)).toHaveLength(1);
  });

  test("a hostless session's rematch is open to any of its former players too", async () => {
    const t = convexTest(schema, modules);
    const created = await createHostlessRoomWithTwoMembers(
      t,
      "owner_b",
      "member_b",
      "room_nohost_2",
    );
    await t
      .withIdentity({ subject: "member_b" })
      .mutation(api.gameSessions.endSession, { session_id: created.session_id });

    const rematch = await t
      .withIdentity({ subject: "member_b" })
      .mutation(api.gameSessions.rematchSession, { session_id: created.session_id });
    if ("error" in rematch) throw new Error(rematch.error);

    const freshSession = await t.query(api.gameSessions.getSessionById, {
      session_id: rematch.session_id,
    });
    expect(freshSession?.host_user_id).toBeUndefined();
    expect(freshSession?.status).toBe("waiting");
  });
});
