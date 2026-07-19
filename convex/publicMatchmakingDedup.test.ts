/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

/**
 * F2a — cross-session dedup guard for public matchmaking.
 *
 * Covers the two concrete scenarios `portal_1.md`'s F2 line names
 * ("double-click join, refresh mid-match"), both of which trace back to
 * the same root gap `publicMatchmaking.ts`'s own header flagged since D1:
 * nothing stopped a caller who already had a live `gamePlayers` row in one
 * public session from being seated into a *second* one.
 *
 * 1. "Double-click join" — two `findOrCreatePublicSession` calls from the
 *    same identity fire close enough together that both could plausibly
 *    land before either had seated the caller. Convex serializes mutations
 *    (same OCC property D2c already demonstrated for two *different*
 *    users), so this is a faithful reproduction via `Promise.all`, same
 *    convention as D2c's own test file.
 * 2. "Refresh mid-match" — the caller is already seated in a session that
 *    has since moved past `"waiting"` (filled to capacity -> `"locked"`,
 *    or had a round started on it). Before F2a, `findOrCreatePublicSession`
 *    only ever searched `by_status_mode` for `"waiting"` rooms, so a
 *    second call in this state was invisible to the caller's actual room
 *    and would spin up an unrelated new session instead of reconnecting
 *    them to the game they were already in.
 *
 * Run with `npx vitest run convex/publicMatchmakingDedup.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

async function seatUsers(
  t: ReturnType<typeof convexTest>,
  namePrefix: string,
  count: number,
) {
  const results: Array<{ session_id: string }> = [];
  for (let i = 0; i < count; i++) {
    const asUser = t.withIdentity({ subject: `${namePrefix}_${i}` });
    const result = await asUser.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in result) {
      throw new Error(`Unexpected seating error for ${namePrefix}_${i}: ${result.error}`);
    }
    results.push(result);
  }
  return results;
}

describe("F2a — public matchmaking cross-session dedup", () => {
  test("two near-simultaneous calls from the same user never double-seat them", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "double_clicker" });

    const [first, second] = await Promise.all([
      asUser.mutation(api.publicMatchmaking.findOrCreatePublicSession, {}),
      asUser.mutation(api.publicMatchmaking.findOrCreatePublicSession, {}),
    ]);

    if ("error" in first) throw new Error(`Unexpected error: ${first.error}`);
    if ("error" in second) throw new Error(`Unexpected error: ${second.error}`);

    // Both calls must resolve to the *same* session — not two different
    // ones — regardless of which call "won" the race to seat first.
    expect(second.session_id).toBe(first.session_id);

    // And the underlying roster reflects exactly one seat for this user,
    // not two rows from the two racing calls.
    const players = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: first.session_id,
    });
    const seatsForUser = players.filter((p) => p.user_id === "double_clicker");
    expect(seatsForUser).toHaveLength(1);
  });

  test("a user already seated in a public session is never routed into a different one by a second call", async () => {
    const t = convexTest(schema, modules);
    const asUser = t.withIdentity({ subject: "repeat_caller" });

    const first = await asUser.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in first) throw new Error(`Unexpected error: ${first.error}`);

    // A second, fully sequential call (not a race — simulates revisiting
    // the lobby page, or a slow double-click where the first call has
    // already committed) must reconnect into the same room, not create or
    // join a different one.
    const second = await asUser.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in second) throw new Error(`Unexpected error: ${second.error}`);
    expect(second.session_id).toBe(first.session_id);
    expect(second.created).toBe(false);

    const players = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: first.session_id,
    });
    expect(players.filter((p) => p.user_id === "repeat_caller")).toHaveLength(1);
  });

  test("refresh mid-match: caller's session has since locked (filled to capacity) — reconnects, doesn't spin up a new room", async () => {
    const t = convexTest(schema, modules);

    // Seat our subject first, then fill the room to capacity around them.
    const subject = t.withIdentity({ subject: "locked_room_refresher" });
    const seated = await subject.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in seated) throw new Error(`Unexpected error: ${seated.error}`);
    const targetSessionId = seated.session_id;

    await seatUsers(t, "filler", 9); // brings this room to capacity (1 + 9 = 10) and locks it
    const lockedSession = await t.query(api.gameSessions.getSessionById, {
      session_id: targetSessionId,
    });
    expect(lockedSession?.status).toBe("locked");

    // Our subject "refreshes" — calls findOrCreatePublicSession again.
    // Before F2a, the by_status_mode("waiting") search would never surface
    // this now-locked room, so the old code would spin up a brand new
    // session and seat them there instead — silently abandoning their real
    // game. F2a must instead reconnect them to the room they're actually in.
    const refreshed = await subject.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in refreshed) throw new Error(`Unexpected error: ${refreshed.error}`);
    expect(refreshed.session_id).toBe(targetSessionId);

    const finalPlayers = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: targetSessionId,
    });
    expect(finalPlayers).toHaveLength(10); // still exactly 10 — no ghost 11th seat
    const uniqueIds = new Set(finalPlayers.map((p) => p.user_id));
    expect(uniqueIds.size).toBe(10); // no duplicate row for the refresher either
  });

  test("refresh mid-match: caller's session has since started a round (in-progress) — reconnects, doesn't spin up a new room", async () => {
    const t = convexTest(schema, modules);

    const subject = t.withIdentity({ subject: "in_progress_refresher" });
    const seated = await subject.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in seated) throw new Error(`Unexpected error: ${seated.error}`);
    const targetSessionId = seated.session_id;

    // Get to the 4-player minimum, then explicitly start a round (not via
    // the autostart countdown/timer, to keep this test independent of
    // E2/D2b's own timing machinery — mirrors F1d/F1f's own convention of
    // calling startRound directly).
    await seatUsers(t, "roundmate", 3);
    const started = await subject.mutation(api.gameRounds.startRound, {
      session_id: targetSessionId,
    });
    if (started && "error" in started) throw new Error(`Unexpected error: ${started.error}`);

    const inProgressSession = await t.query(api.gameSessions.getSessionById, {
      session_id: targetSessionId,
    });
    expect(inProgressSession?.status).toBe("locked"); // D2b: public sessions lock on round start

    const refreshed = await subject.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in refreshed) throw new Error(`Unexpected error: ${refreshed.error}`);
    expect(refreshed.session_id).toBe(targetSessionId);

    const finalPlayers = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: targetSessionId,
    });
    expect(finalPlayers.filter((p) => p.user_id === "in_progress_refresher")).toHaveLength(1);
  });

  test("a user whose old public session already ended is free to matchmake into a fresh one", async () => {
    const t = convexTest(schema, modules);
    const subject = t.withIdentity({ subject: "post_game_leaver" });

    const first = await subject.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in first) throw new Error(`Unexpected error: ${first.error}`);

    // Simulate the session this user was in having ended (e.g. host ended
    // it, or D3's retire path fired) rather than the user explicitly
    // leaving — `endSession`-style terminal state, not `leaveSession`'s
    // row-delete. The dedup check must not treat an `"ended"` row as a
    // live seat to route the user back into.
    await t.run(async (ctx) => {
      const session = await ctx.db
        .query("gameSessions")
        .withIndex("by_session_id", (q) => q.eq("session_id", first.session_id))
        .first();
      if (session) await ctx.db.patch(session._id, { status: "ended" });
    });

    const second = await subject.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in second) throw new Error(`Unexpected error: ${second.error}`);

    // Must NOT be routed back into the now-ended session.
    expect(second.session_id).not.toBe(first.session_id);
    const newSession = await t.query(api.gameSessions.getSessionById, {
      session_id: second.session_id,
    });
    expect(newSession?.status).not.toBe("ended");
  });
});
