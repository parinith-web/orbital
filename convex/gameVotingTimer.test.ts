/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { DEFAULT_VOTING_DURATION_MS } from "./games/turnOrder";

/**
 * F1g — the voting-phase auto-reveal timer this session added. Companion
 * to gameCountdown.test.ts (which proves B4's speaking-turn timer) and
 * gameF1EndToEnd.test.ts (which proves the disconnect-driven reveal
 * paths) — this file's job is the one path neither of those covers: a
 * fully CONNECTED player who just never casts a vote. Before this fix
 * nothing ever unstuck that round; it should now force-reveal once
 * `voting_expires_at` passes.
 *
 * Run with `npx vitest run convex/gameVotingTimer.test.ts`.
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

async function runSpeakingToVoting(t: ReturnType<typeof convexTest>, sessionId: string) {
  for (let guard = 0; guard < 20; guard++) {
    const view = await getRoundViewAs(t, "any", sessionId).catch(() => null);
    // getRoundView requires an authenticated subject that's actually a
    // player; use the current speaker itself to both read and advance.
    const speaker = view?.current_speaker_user_id;
    if (!view || view.status !== "speaking" || !speaker) break;
    const result = await t
      .withIdentity({ subject: speaker })
      .mutation(api.gameRounds.advanceSpeaker, { session_id: sessionId });
    if ("error" in result) throw new Error(`advanceSpeaker failed: ${result.error}`);
  }
}

describe("F1g — voting-phase auto-reveal timer", () => {
  test("entering voting stamps a voting_expires_at deadline", async () => {
    const t = convexTest(schema, modules);
    const seeded = await seatUsers(t, "vt", 4);
    const sessionId = seeded[0].session_id;

    const started = await t
      .withIdentity({ subject: "vt_0" })
      .mutation(api.gameRounds.startRound, { session_id: sessionId });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

    // Drive speaking to completion using whichever subject is currently up.
    for (let guard = 0; guard < 20; guard++) {
      const view = await getRoundViewAs(t, "vt_0", sessionId);
      if (!view || view.status !== "speaking") break;
      const speaker = view.current_speaker_user_id!;
      const result = await t
        .withIdentity({ subject: speaker })
        .mutation(api.gameRounds.advanceSpeaker, { session_id: sessionId });
      if ("error" in result) throw new Error(`advanceSpeaker failed: ${result.error}`);
    }

    const voting = await getRoundViewAs(t, "vt_0", sessionId);
    expect(voting?.status).toBe("voting");
    expect(voting?.voting_expires_at).not.toBeNull();
    expect(voting!.voting_expires_at!).toBeGreaterThan(Date.now() - 1000);
  });

  test("a connected player who never votes no longer stalls the round forever", async () => {
    vi.useFakeTimers();
    try {
      const t = convexTest(schema, modules);
      const seeded = await seatUsers(t, "vs", 4);
      const sessionId = seeded[0].session_id;
      const subjects = ["vs_0", "vs_1", "vs_2", "vs_3"];

      const started = await t
        .withIdentity({ subject: "vs_0" })
        .mutation(api.gameRounds.startRound, { session_id: sessionId });
      if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

      await runSpeakingToVoting(t, sessionId);

      const voting = await getRoundViewAs(t, "vs_0", sessionId);
      expect(voting?.status).toBe("voting");
      expect(voting?.required_voter_ids.length).toBe(4);

      const [v0, v1, v2, v3] = voting!.speaking_order;
      // Every player except v3 votes. v3 stays fully connected (no
      // disconnect anywhere in this test) and simply never casts a vote —
      // exactly the case F1d's connected-required-voters check can't
      // unstick on its own.
      for (const voter of [v0, v1, v2]) {
        const target = voter === v0 ? v1 : v0;
        const result = await t.withIdentity({ subject: voter }).mutation(api.gameRounds.castVote, {
          session_id: sessionId,
          voted_for_id: target,
        });
        if ("error" in result) throw new Error(`castVote failed: ${result.error}`);
      }
      void v3;

      const stillVoting = await getRoundViewAs(t, "vs_0", sessionId);
      expect(stillVoting?.status).toBe("voting");

      // Before the fix, nothing would ever move this forward. Advance the
      // fake clock past the voting deadline and let the scheduled job fire.
      await vi.advanceTimersByTimeAsync(DEFAULT_VOTING_DURATION_MS + 1000);

      const revealed = await getRoundViewAs(t, "vs_0", sessionId);
      expect(revealed?.status).toBe("revealed");
      expect(revealed?.reveal).not.toBeNull();

      // The never-voted player's absence shouldn't crash scoring — reveal
      // just runs with whatever votes actually exist.
      const finalPlayers = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
      expect(finalPlayers.length).toBe(4);
      finalPlayers.forEach((p) => expect(p.score).toBeTypeOf("number"));
      void subjects;
    } finally {
      vi.useRealTimers();
    }
  });

  test("a reveal that already happened (last required vote landing) makes the scheduled job a no-op", async () => {
    vi.useFakeTimers();
    try {
      const t = convexTest(schema, modules);
      const seeded = await seatUsers(t, "vn", 3);
      const sessionId = seeded[0].session_id;

      const started = await t
        .withIdentity({ subject: "vn_0" })
        .mutation(api.gameRounds.startRound, { session_id: sessionId });
      if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

      await runSpeakingToVoting(t, sessionId);

      const voting = await getRoundViewAs(t, "vn_0", sessionId);
      const [v0, v1, v2] = voting!.speaking_order;

      // Everyone votes right away — should auto-reveal via castVote itself,
      // well before the voting timer would ever fire.
      for (const voter of [v0, v1, v2]) {
        const target = voter === v0 ? v1 : v0;
        const result = await t.withIdentity({ subject: voter }).mutation(api.gameRounds.castVote, {
          session_id: sessionId,
          voted_for_id: target,
        });
        if ("error" in result) throw new Error(`castVote failed: ${result.error}`);
      }

      const revealedEarly = await getRoundViewAs(t, "vn_0", sessionId);
      expect(revealedEarly?.status).toBe("revealed");
      const resultSnapshot = revealedEarly?.reveal;

      // Let the (now-stale) scheduled voting-timer job fire anyway — it
      // should see status !== "voting" and no-op, not double-score or throw.
      await vi.advanceTimersByTimeAsync(DEFAULT_VOTING_DURATION_MS + 1000);

      const afterTimerFires = await getRoundViewAs(t, "vn_0", sessionId);
      expect(afterTimerFires?.status).toBe("revealed");
      expect(afterTimerFires?.reveal).toEqual(resultSnapshot);
    } finally {
      vi.useRealTimers();
    }
  });
});
