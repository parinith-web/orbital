/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect, vi, beforeEach, afterEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

/**
 * E2 — public lobby autostart countdown, executed (not just asserted), same
 * convex-test approach D2c/D3 introduced.
 *
 * Per SIGNAL_PROGRESS.md's E1 "Next up" note, this confirms (and, since
 * nothing before this session actually wired it, *builds*) where
 * `min_players_to_start`/`countdown_started_at` autostart behavior lives:
 * `gameRounds.ts`'s `maybeStartAutostartCountdown` / `maybeCancelAutostartCountdown`
 * / `autoStartRound`, called from `publicMatchmaking.ts` (on join) and
 * `gameSessions.ts`'s `leaveSession` (on departure).
 *
 * Run with `npx vitest run convex/gameCountdown.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

const AUTOSTART_COUNTDOWN_MS = 15 * 1000; // must match gameRounds.ts's exported AUTOSTART_COUNTDOWN_MS

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

describe("E2 — public lobby autostart countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test("countdown starts the instant the 4th connected player joins, not before", async () => {
    const t = convexTest(schema, modules);

    const seeded = await seatUsers(t, "p", 3);
    const sessionId = seeded[0].session_id;

    let session = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(session?.countdown_started_at).toBeUndefined();

    // A genuinely new 4th user brings connected count to threshold.
    const fourth = await t
      .withIdentity({ subject: "p_3" })
      .mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in fourth) throw new Error(`Seating error: ${fourth.error}`);
    expect(fourth.session_id).toBe(sessionId);

    session = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(session?.status).toBe("waiting");
    expect(session?.countdown_started_at).toBeTypeOf("number");
  });

  test("a round autostarts once the 15s countdown elapses, with no player action", async () => {
    const t = convexTest(schema, modules);

    const seeded = await seatUsers(t, "a", 4);
    const sessionId = seeded[0].session_id;

    const midCountdown = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(midCountdown?.countdown_started_at).toBeTypeOf("number");
    const roundBefore = await t.query(api.gameRounds.getRoundView, { session_id: sessionId });
    expect(roundBefore).toBeNull(); // no round yet — still just ticking down

    await vi.advanceTimersByTimeAsync(AUTOSTART_COUNTDOWN_MS);

    const afterCountdown = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(afterCountdown?.current_round).toBe(1);
    // Public + a round just started == "locked" per D2b, and the countdown
    // timestamp itself is cleared now that it's done its job.
    expect(afterCountdown?.status).toBe("locked");
    expect(afterCountdown?.countdown_started_at).toBeUndefined();

    const roundAfter = await t
      .withIdentity({ subject: "a_0" })
      .query(api.gameRounds.getRoundView, { session_id: sessionId });
    expect(roundAfter?.status).toBe("speaking");
  });

  test("a departure dropping below threshold cancels the countdown; a later rejoin gets a fresh one", async () => {
    const t = convexTest(schema, modules);

    const seeded = await seatUsers(t, "b", 4);
    const sessionId = seeded[0].session_id;

    const running = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(running?.countdown_started_at).toBeTypeOf("number");

    // One of the four leaves, dropping back to 3 — below min_players_to_start (4).
    await t
      .withIdentity({ subject: "b_0" })
      .mutation(api.gameSessions.leaveSession, { session_id: sessionId });

    const cancelled = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(cancelled?.countdown_started_at).toBeUndefined();

    // Let the original 15s window fully elapse — the stale scheduled job
    // (still carrying the old countdown_started_at) must be a no-op: no
    // round should start on a room that's genuinely below threshold now.
    await vi.advanceTimersByTimeAsync(AUTOSTART_COUNTDOWN_MS);
    const stillWaiting = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(stillWaiting?.status).toBe("waiting");
    expect(stillWaiting?.current_round).toBe(0);

    // A fresh 4th player brings it back to threshold and starts a brand
    // new countdown (not the stale one).
    const rejoiner = await t
      .withIdentity({ subject: "b_4" })
      .mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
    if ("error" in rejoiner) throw new Error(`Seating error: ${rejoiner.error}`);
    expect(rejoiner.session_id).toBe(sessionId);

    const recounting = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(recounting?.countdown_started_at).toBeTypeOf("number");

    await vi.advanceTimersByTimeAsync(AUTOSTART_COUNTDOWN_MS);
    const started = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(started?.current_round).toBe(1);
  });

  test("a manual startRound mid-countdown makes the later scheduled autostart a safe no-op", async () => {
    const t = convexTest(schema, modules);

    const seeded = await seatUsers(t, "c", 4);
    const sessionId = seeded[0].session_id;

    // A player manually starts the round well before the countdown elapses.
    const manual = await t
      .withIdentity({ subject: "c_0" })
      .mutation(api.gameRounds.startRound, { session_id: sessionId });
    if ("error" in manual) throw new Error(`startRound failed: ${manual.error}`);
    expect(manual.round_number).toBe(1);

    // The countdown's own scheduled job still fires at its original time —
    // it must not clobber the round already in progress or advance
    // current_round a second time.
    await vi.advanceTimersByTimeAsync(AUTOSTART_COUNTDOWN_MS);

    const session = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(session?.current_round).toBe(1); // unchanged by the stale autostart job

    const roundView = await t
      .withIdentity({ subject: "c_0" })
      .query(api.gameRounds.getRoundView, { session_id: sessionId });
    expect(roundView?.round_number).toBe(1);
    expect(roundView?.status).toBe("speaking");
  });
});
