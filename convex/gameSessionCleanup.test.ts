/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

/**
 * D3 — recycle-vs-retire cron, executed (not just asserted), same
 * convex-test approach D2c introduced. This drives the actual self-
 * rescheduling `sweepEmptyPublicSessions` internal mutation forward in
 * time via `vi.useFakeTimers()`, one `CLEANUP_CHECK_INTERVAL_MS` tick at a
 * time, and checks the real `gameSessions`/`gameRounds` rows after each
 * tick — not a simulation of what the cron *should* do, the actual
 * scheduled function actually running against convex-test's backend.
 *
 * Run with `npx vitest run convex/gameSessionCleanup.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

const CLEANUP_CHECK_INTERVAL_MS = 60 * 1000; // must match gameSessions.ts's private constant
const RETIRE_THRESHOLD_MS = 5 * 60 * 1000; // gameSessions.ts's exported RETIRE_THRESHOLD_MS

/** Advances fake time by exactly one sweep interval and lets that one scheduled sweep run to completion. */
async function tick() {
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

describe("D3 — public session recycle-vs-retire cleanup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("a locked-then-emptied room recycles back to waiting within the grace period", async () => {
    const t = convexTest(schema, modules);

    // Fill a public room to capacity (10) so it locks — reuses the same
    // real matchmaking/seating path D2c's tests already proved correct.
    const seeded = await seatUsers(t, "p", 10);
    const sessionId = seeded[0].session_id;
    expect(seeded.every((s) => s.session_id === sessionId)).toBe(true);

    const locked = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(locked?.status).toBe("locked");

    // A round actually gets played and finishes, leaving a gameRounds row
    // behind — this is exactly the "stale round data" case recycling needs
    // to clean up, not just the session's own status field.
    const starter = t.withIdentity({ subject: "p_0" });
    const started = await starter.mutation(api.gameRounds.startRound, { session_id: sessionId });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

    // Everyone leaves — session should go empty and get its cleanup timer stamped.
    for (let i = 0; i < 10; i++) {
      const leaver = t.withIdentity({ subject: `p_${i}` });
      const left = await leaver.mutation(api.gameSessions.leaveSession, { session_id: sessionId });
      expect(left).toEqual({ success: true });
    }

    const emptied = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(emptied?.status).toBe("locked"); // not yet swept
    expect(emptied?.last_emptied_at).toBeTypeOf("number");

    // One sweep interval later (well inside the 5-minute grace period):
    // should have recycled back to "waiting", round history cleared.
    await tick();

    const recycled = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(recycled?.status).toBe("waiting");
    expect(recycled?.current_round).toBe(0);
    expect(recycled?.countdown_started_at).toBeUndefined();
    // Recycling doesn't clear last_emptied_at — the room is still tracked
    // as empty (nobody's joined the recycled room yet), so a still-idle
    // recycled room can eventually retire too if no one claims it.
    expect(recycled?.last_emptied_at).toBeTypeOf("number");

    // The room is genuinely rejoinable under the SAME session_id/room_id —
    // the actual point of "recycle" rather than "retire."
    const rejoiner = t.withIdentity({ subject: "newcomer" });
    const rejoined = await rejoiner.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in rejoined) throw new Error(`Rejoin failed: ${rejoined.error}`);
    expect(rejoined.session_id).toBe(sessionId);

    // No leftover round rows from the finished game are visible via the
    // round-view query — confirms the stale gameRounds cleanup actually
    // happened, not just the session's own fields.
    const roundView = await rejoiner.query(api.gameRounds.getRoundView, { session_id: sessionId });
    expect(roundView).toBeNull();
  });

  test("a room that stays empty past the 5-minute grace period retires", async () => {
    const t = convexTest(schema, modules);

    const seeded = await seatUsers(t, "q", 10);
    const sessionId = seeded[0].session_id;

    for (let i = 0; i < 10; i++) {
      const leaver = t.withIdentity({ subject: `q_${i}` });
      await leaver.mutation(api.gameSessions.leaveSession, { session_id: sessionId });
    }

    // Advance one full sweep interval at a time until we're past the
    // 5-minute retire threshold, checking real elapsed sweep ticks rather
    // than jumping straight to the end.
    const ticksToRetire = Math.ceil(RETIRE_THRESHOLD_MS / CLEANUP_CHECK_INTERVAL_MS);
    for (let i = 0; i < ticksToRetire; i++) {
      await tick();
    }

    const retired = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(retired?.status).toBe("ended");

    // Retirement is terminal and doesn't hand back the same room —
    // matchmaking must mint a genuinely new session for the next joiner
    // rather than resurrecting the retired one.
    const newcomer = t.withIdentity({ subject: "late_arrival" });
    const placed = await newcomer.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in placed) throw new Error(`Matchmaking failed: ${placed.error}`);
    expect(placed.session_id).not.toBe(sessionId);
  });

  test("a room that gets rejoined mid-grace-period is never retired out from under its players", async () => {
    const t = convexTest(schema, modules);

    const seeded = await seatUsers(t, "r", 10);
    const sessionId = seeded[0].session_id;

    for (let i = 0; i < 10; i++) {
      const leaver = t.withIdentity({ subject: `r_${i}` });
      await leaver.mutation(api.gameSessions.leaveSession, { session_id: sessionId });
    }

    // One tick in: recycles to "waiting". A player rejoins right after.
    await tick();
    const rejoiner = t.withIdentity({ subject: "rejoiner" });
    const rejoined = await rejoiner.mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in rejoined) throw new Error(`Rejoin failed: ${rejoined.error}`);
    expect(rejoined.session_id).toBe(sessionId);

    // Even after enough ticks to have crossed the retire threshold from
    // the *original* empty timestamp, the now-occupied room must still be
    // alive — it should never be retired while someone is actually in it.
    const ticksToRetire = Math.ceil(RETIRE_THRESHOLD_MS / CLEANUP_CHECK_INTERVAL_MS);
    for (let i = 0; i < ticksToRetire; i++) {
      await tick();
    }

    const stillAlive = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(stillAlive?.status).not.toBe("ended");
    expect(stillAlive?.last_emptied_at).toBeUndefined();

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    expect(players.map((p) => p.user_id)).toContain("rejoiner");
  });
});
