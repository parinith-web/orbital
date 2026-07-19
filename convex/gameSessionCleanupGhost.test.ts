/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { RETIRE_THRESHOLD_MS } from "./gameSessions";
import { HEARTBEAT_INTERVAL_MS, STALE_THRESHOLD_MS } from "./gamePresence";

/**
 * F3 — the "ghost room" edge case: every player in a public session
 * disconnects (crash / network death / force-quit) WITHOUT anyone ever
 * calling `leaveSession`. Before F3, D3's sweep only ever learned a public
 * room was empty via `leaveSession` deleting the last `gamePlayers` row, so
 * a room like this stayed `"waiting"`/`"locked"`/`"in_progress"` and
 * un-recyclable forever — see `gameSessions.ts`'s "CLEANUP, GHOST-ROOM EDGE
 * CASE" doc comment for the full failure mode.
 *
 * Same "drive the real scheduled functions forward with fake timers, check
 * real rows" bar D3's own `gameSessionCleanup.test.ts` established — not a
 * simulation of what the cron *should* do.
 *
 * `CLEANUP_CHECK_INTERVAL_MS` (D3's sweep cadence) isn't exported from
 * gameSessions.ts, so it's re-declared here the same way
 * `gameSessionCleanup.test.ts` already does, rather than exporting a
 * private implementation constant just for a test file.
 *
 * Run with `npx vitest run convex/gameSessionCleanupGhost.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

const CLEANUP_CHECK_INTERVAL_MS = 60 * 1000; // must match gameSessions.ts's private constant

/** Advances fake time by exactly one D3 sweep interval and lets that one scheduled sweep run to completion. */
async function tickCleanup() {
  await vi.advanceTimersByTimeAsync(CLEANUP_CHECK_INTERVAL_MS);
}

async function seatUsers(t: ReturnType<typeof convexTest>, namePrefix: string, count: number) {
  const results: Array<{ session_id: string }> = [];
  for (let i = 0; i < count; i++) {
    const result = await t
      .withIdentity({ subject: `${namePrefix}_${i}` })
      .mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in result) throw new Error(`Seating error: ${result.error}`);
    results.push(result);
  }
  return results;
}

describe("F3 — ghost-room cleanup (all players disconnect, nobody calls leaveSession)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("goOffline from every player in a public room (no leaveSession) still stamps last_emptied_at and eventually recycles", async () => {
    const t = convexTest(schema, modules);

    // A small room, well under capacity, so it never locks — this is
    // exactly the "waiting" case old code assumed could never have
    // lingering rows once it looked empty (see the recycle branch's
    // updated comment in gameSessions.ts).
    const seeded = await seatUsers(t, "g", 3);
    const sessionId = seeded[0].session_id;

    for (let i = 0; i < 3; i++) {
      const leaver = t.withIdentity({ subject: `g_${i}` });
      const result = await leaver.mutation(api.gamePresence.goOffline, {
        session_id: sessionId,
      });
      expect(result).toEqual({ success: true });
    }

    // Rows must still exist — goOffline is not leaveSession — but the
    // session should already be stamped as emptied by the last goOffline
    // call, well before any D3 sweep has run.
    const ghostRows = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: sessionId,
    });
    expect(ghostRows).toHaveLength(3);
    expect(ghostRows.every((p) => p.connected === false)).toBe(true);

    const stampedSession = await t.query(api.gameSessions.getSessionById, {
      session_id: sessionId,
    });
    expect(stampedSession?.last_emptied_at).toBeTypeOf("number");
    expect(stampedSession?.status).toBe("waiting"); // never hit capacity

    // One D3 sweep interval later (well inside the 5-minute grace period):
    // the ghost rows must be purged so the room doesn't silently count as
    // occupied forever.
    await tickCleanup();

    const purged = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: sessionId,
    });
    expect(purged).toHaveLength(0);

    // And the room is genuinely rejoinable under the SAME session_id —
    // confirms matchmaking's own capacity check (raw gamePlayers.length)
    // no longer sees phantom occupants.
    const rejoiner = t.withIdentity({ subject: "newcomer" });
    const rejoined = await rejoiner.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in rejoined) throw new Error(`Rejoin failed: ${rejoined.error}`);
    expect(rejoined.session_id).toBe(sessionId);
  });

  test("a fully-ghosted LOCKED room recycles to waiting with round state cleared, same as an explicitly-left one", async () => {
    const t = convexTest(schema, modules);

    // Fill to capacity so it locks (D2a), start a round so there's actual
    // gameRounds state to clean up, exactly like D3's own "locked-then-
    // emptied" test — the only difference here is the room empties via
    // goOffline, never leaveSession.
    const seeded = await seatUsers(t, "h", 10);
    const sessionId = seeded[0].session_id;
    const locked = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(locked?.status).toBe("locked");

    const starter = t.withIdentity({ subject: "h_0" });
    const started = await starter.mutation(api.gameRounds.startRound, { session_id: sessionId });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

    for (let i = 0; i < 10; i++) {
      const ghost = t.withIdentity({ subject: `h_${i}` });
      await ghost.mutation(api.gamePresence.goOffline, { session_id: sessionId });
    }

    const stillThere = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: sessionId,
    });
    expect(stillThere).toHaveLength(10); // rows persist, only `connected` flipped

    await tickCleanup();

    const recycled = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(recycled?.status).toBe("waiting");
    expect(recycled?.current_round).toBe(0);

    const roundView = await starter.query(api.gameRounds.getRoundView, { session_id: sessionId });
    expect(roundView).toBeNull();

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    expect(players).toHaveLength(0);
  });

  test("a room where nobody ever calls goOffline either — pure heartbeat staleness — still gets caught and recycled", async () => {
    const t = convexTest(schema, modules);

    const seeded = await seatUsers(t, "i", 2);
    const sessionId = seeded[0].session_id;

    // Kick the F1a staleness sweep off, same as the client hook's
    // on-mount heartbeat would, then just stop heartbeating entirely for
    // both players — models a tab/network death that never fires
    // beforeunload at all (no goOffline, no leaveSession).
    for (let i = 0; i < 2; i++) {
      await t
        .withIdentity({ subject: `i_${i}` })
        .mutation(api.gamePresence.heartbeat, { session_id: sessionId });
    }

    const staleTicksNeeded = Math.ceil(STALE_THRESHOLD_MS / HEARTBEAT_INTERVAL_MS) + 1;
    for (let i = 0; i < staleTicksNeeded; i++) {
      await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
    }

    const goneStale = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: sessionId,
    });
    expect(goneStale.every((p) => p.connected === false)).toBe(true);

    const stamped = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(stamped?.last_emptied_at).toBeTypeOf("number");

    await tickCleanup();

    const purged = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: sessionId,
    });
    expect(purged).toHaveLength(0);
  });

  test("a room with one still-connected player is never treated as empty, even if everyone else ghosts", async () => {
    const t = convexTest(schema, modules);

    const seeded = await seatUsers(t, "j", 3);
    const sessionId = seeded[0].session_id;
    const survivor = t.withIdentity({ subject: "j_0" });

    // Two players ghost via goOffline; the third keeps heartbeating.
    for (let i = 1; i < 3; i++) {
      await t
        .withIdentity({ subject: `j_${i}` })
        .mutation(api.gamePresence.goOffline, { session_id: sessionId });
    }
    await survivor.mutation(api.gamePresence.heartbeat, { session_id: sessionId });

    const notEmptied = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(notEmptied?.last_emptied_at).toBeUndefined();

    // Even several D3 sweep intervals later (well past the retire
    // threshold), the room and the survivor's own seat must still be
    // intact — one connected player is enough to keep it alive. The
    // survivor has to keep heartbeating through this whole stretch, or
    // F1a's own independent staleness sweep (25s threshold) would mark
    // them disconnected too well before a single 60s D3 tick elapses —
    // that would make the room genuinely, correctly retire, which isn't
    // what this test is checking.
    const totalMsToElapse =
      (Math.ceil(RETIRE_THRESHOLD_MS / CLEANUP_CHECK_INTERVAL_MS) + 1) * CLEANUP_CHECK_INTERVAL_MS;
    const subTicks = Math.ceil(totalMsToElapse / HEARTBEAT_INTERVAL_MS);
    for (let i = 0; i < subTicks; i++) {
      await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
      await survivor.mutation(api.gamePresence.heartbeat, { session_id: sessionId });
    }

    const stillAlive = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(stillAlive?.status).not.toBe("ended");

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    expect(players.map((p) => p.user_id)).toContain("j_0");
  });

  test("a fully-ghosted room past the 5-minute grace period retires (status: ended) and purges its ghost rows", async () => {
    const t = convexTest(schema, modules);

    const seeded = await seatUsers(t, "k", 4);
    const sessionId = seeded[0].session_id;

    for (let i = 0; i < 4; i++) {
      await t
        .withIdentity({ subject: `k_${i}` })
        .mutation(api.gamePresence.goOffline, { session_id: sessionId });
    }

    const ticksToRetire = Math.ceil(RETIRE_THRESHOLD_MS / CLEANUP_CHECK_INTERVAL_MS);
    for (let i = 0; i < ticksToRetire; i++) {
      await tickCleanup();
    }

    const retired = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(retired?.status).toBe("ended");

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    expect(players).toHaveLength(0);

    // Matchmaking must mint a fresh session, not resurrect the retired one.
    const newcomer = t.withIdentity({ subject: "late_ghost_arrival" });
    const placed = await newcomer.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in placed) throw new Error(`Matchmaking failed: ${placed.error}`);
    expect(placed.session_id).not.toBe(sessionId);
  });
});
