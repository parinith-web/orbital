/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { HEARTBEAT_INTERVAL_MS, STALE_THRESHOLD_MS } from "./gamePresence";

/**
 * F1f — chained end-to-end pass across F1a (heartbeat/staleness detection),
 * F1b (reconnect race guard), F1c (skip a disconnected current speaker),
 * and F1d (disconnected-voter reveal policy), all in ONE continuous
 * session lifecycle rather than each mechanism's own isolated unit tests
 * (gamePresence.test.ts / gameDisconnectRoundFlow.test.ts). Those files
 * already prove each mechanism correct in isolation with their own
 * injection-and-revert teeth proofs; this file's job is proving they
 * actually COMPOSE — that a real multi-phase play session (seat -> start
 * -> a real network-style silent disconnect mid-speaking -> reconnect ->
 * finish the round -> a clean-close disconnect mid-voting) comes out the
 * other end in a consistent state, not just that each isolated piece works
 * on its own.
 *
 * Deliberately drives the DISCONNECT half of this scenario through the
 * staleness SWEEP (F1a's `markStaleDisconnected`, i.e. a silent network
 * drop that never calls `goOffline`) rather than `goOffline` directly —
 * `gameDisconnectRoundFlow.test.ts`'s F1c tests already cover the
 * `goOffline` path, so this file exercises the other detection path
 * instead, to get real coverage of the full F1a -> F1c pipeline rather than
 * re-proving the same `goOffline` -> F1c link a second time.
 *
 * Run with `npx vitest run convex/gameF1EndToEnd.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

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

async function getRoundViewAs(t: ReturnType<typeof convexTest>, subject: string, sessionId: string) {
  return await t.withIdentity({ subject }).query(api.gameRounds.getRoundView, { session_id: sessionId });
}

async function heartbeatAll(t: ReturnType<typeof convexTest>, subjects: string[], sessionId: string) {
  for (const subject of subjects) {
    await t.withIdentity({ subject }).mutation(api.gamePresence.heartbeat, { session_id: sessionId });
  }
}

describe("F1f — chained F1a-F1d end-to-end play session", () => {
  test("silent mid-speaking disconnect (sweep-detected) -> skip -> reconnect -> finish round -> mid-voting disconnect -> reveal", async () => {
    vi.useFakeTimers();
    try {
      const t = convexTest(schema, modules);
      const subjects = ["e_0", "e_1", "e_2", "e_3"];
      const seeded = await seatUsers(t, "e", 4);
      const sessionId = seeded[0].session_id;
      expect(seeded.every((s) => s.session_id === sessionId)).toBe(true);

      // Everyone heartbeats once on "mount" — this is also what kicks off
      // F1a's staleness sweep for the first time (`scheduleGamePresenceSweepIfNeeded`).
      await heartbeatAll(t, subjects, sessionId);

      const started = await t.withIdentity({ subject: "e_0" }).mutation(api.gameRounds.startRound, {
        session_id: sessionId,
      });
      if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

      const speakingRound = await getRoundViewAs(t, "e_0", sessionId);
      expect(speakingRound?.status).toBe("speaking");
      const strandedSpeaker = speakingRound!.current_speaker_user_id!;
      const others = subjects.filter((s) => s !== strandedSpeaker);

      // --- PHASE 1 (F1a + F1c): strandedSpeaker's client silently dies —
      // no goOffline, just no more heartbeats — while everyone else keeps
      // heartbeating normally. Drive the fake clock forward in real
      // heartbeat-interval steps (matching the sweep's own re-scheduling
      // cadence) until strandedSpeaker crosses STALE_THRESHOLD_MS.
      let ticks = 0;
      const maxTicks = Math.ceil(STALE_THRESHOLD_MS / HEARTBEAT_INTERVAL_MS) + 2;
      while (ticks < maxTicks) {
        await vi.advanceTimersByTimeAsync(HEARTBEAT_INTERVAL_MS);
        await heartbeatAll(t, others, sessionId); // strandedSpeaker excluded — that's the "drop"
        ticks++;
        const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
        const strandedRow = players.find((p) => p.user_id === strandedSpeaker);
        if (strandedRow?.connected === false) break;
      }

      const playersAfterStale = await t.query(api.gameSessions.getSessionPlayers, {
        session_id: sessionId,
      });
      expect(playersAfterStale.find((p) => p.user_id === strandedSpeaker)?.connected).toBe(false);

      // F1c's payoff: the sweep detecting staleness should itself have
      // already moved the round off strandedSpeaker — no goOffline call,
      // no manual advanceSpeaker, no one waiting out a 30s turn.
      const afterSweepSkip = await getRoundViewAs(t, "e_0", sessionId);
      if (afterSweepSkip?.status === "speaking") {
        expect(afterSweepSkip.current_speaker_user_id).not.toBe(strandedSpeaker);
      } else {
        expect(afterSweepSkip?.status).toBe("voting");
      }

      // --- PHASE 2 (F1a reconnect + F1b race-safety-adjacent path):
      // strandedSpeaker's client comes back and heartbeats again — a bare
      // heartbeat IS the reconnect signal (no separate mutation), same as
      // gamePresence.ts's own header states.
      await t.withIdentity({ subject: strandedSpeaker }).mutation(api.gamePresence.heartbeat, {
        session_id: sessionId,
      });
      const playersAfterReconnect = await t.query(api.gameSessions.getSessionPlayers, {
        session_id: sessionId,
      });
      expect(playersAfterReconnect.find((p) => p.user_id === strandedSpeaker)?.connected).toBe(true);

      // --- PHASE 3: finish out the speaking phase normally (manual nudges,
      // like a real client's "done talking" button) until voting opens.
      // strandedSpeaker is back, connected, and still in speaking_order —
      // if it's their turn again later in the order, they can take it.
      for (let guard = 0; guard < 20; guard++) {
        const view = await getRoundViewAs(t, "e_0", sessionId);
        if (!view || view.status !== "speaking") break;
        const speaker = view.current_speaker_user_id!;
        const result = await t
          .withIdentity({ subject: speaker })
          .mutation(api.gameRounds.advanceSpeaker, { session_id: sessionId });
        if ("error" in result) throw new Error(`advanceSpeaker failed: ${result.error}`);
      }

      const voting = await getRoundViewAs(t, "e_0", sessionId);
      expect(voting?.status).toBe("voting");
      // Reconnected player is still a required voter now that they're
      // connected again — proves the reconnect (F1a/F1b) actually
      // re-integrated them into F1d's required-voters roster, not just the
      // raw `connected` flag in isolation.
      expect(voting?.required_voter_ids).toContain(strandedSpeaker);

      // --- PHASE 4 (F1d): mid-voting, one player cleanly closes their tab
      // (goOffline this time, not the sweep — exercising the other
      // detection path than PHASE 1 used, for full pipeline coverage).
      const [v0, v1, v2, v3] = voting!.speaking_order;
      const droppingVoter = v3;
      const remainingVoters = [v0, v1, v2].filter((id) => id !== droppingVoter);

      // Cast every remaining required voter's vote except leave the drop
      // for last, so we can prove the disconnect itself (not a stray
      // castVote) is what triggers reveal.
      for (const voter of remainingVoters) {
        const target = voter === v0 ? v1 : v0; // arbitrary, just not self
        const result = await t.withIdentity({ subject: voter }).mutation(api.gameRounds.castVote, {
          session_id: sessionId,
          voted_for_id: target,
        });
        if ("error" in result) throw new Error(`castVote failed: ${result.error}`);
      }

      const stillVoting = await getRoundViewAs(t, "e_0", sessionId);
      expect(stillVoting?.status).toBe("voting");

      await t.withIdentity({ subject: droppingVoter }).mutation(api.gamePresence.goOffline, {
        session_id: sessionId,
      });

      const finalView = await getRoundViewAs(t, "e_0", sessionId);
      expect(finalView?.status).toBe("revealed");
      expect(finalView?.reveal).not.toBeNull();

      // Sanity: the whole chain didn't corrupt player bookkeeping — still
      // exactly 4 gamePlayers rows, no duplicates, scores are real numbers.
      const finalPlayers = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
      expect(finalPlayers.length).toBe(4);
      expect(new Set(finalPlayers.map((p) => p.user_id)).size).toBe(4);
      finalPlayers.forEach((p) => expect(p.score).toBeTypeOf("number"));
    } finally {
      vi.useRealTimers();
    }
  });
});
