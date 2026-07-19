/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { DEFAULT_TURN_DURATION_MS } from "./games/turnOrder";

/**
 * F1c (skip a disconnected current speaker) + F1d (voting-phase disconnect
 * policy — a disconnected voter no longer blocks auto-reveal), executed for
 * real against convex-test's simulated backend, same bar D2c/D3/E2/F1a/F1b
 * all established (a real transaction lock + scheduler, not a hand-rolled
 * mock of what the handlers *should* do).
 *
 * Deliberately uses `startRound` manually rather than letting the public
 * lobby's autostart countdown fire (see gameCountdown.test.ts for that
 * timer's own coverage) — these tests care about round/vote state
 * transitions, not the countdown, and a manual start keeps `vi.useFakeTimers`
 * out of the picture entirely for this file (no scheduled-job clock-driving
 * needed: `goOffline` is a synchronous mutation call, not a timer).
 *
 * Run with `npx vitest run convex/gameDisconnectRoundFlow.test.ts`.
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

/** Advances a "speaking" round all the way to "voting" by having whoever's
 * actually the current speaker call advanceSpeaker each time — mirrors a
 * real client's manual "done talking" nudge, not the timer. */
async function advanceToVoting(t: ReturnType<typeof convexTest>, anySubject: string, sessionId: string) {
  for (let guard = 0; guard < 20; guard++) {
    const view = await getRoundViewAs(t, anySubject, sessionId);
    if (!view || view.status !== "speaking") return view;
    const speaker = view.current_speaker_user_id;
    if (!speaker) throw new Error("speaking round with no current speaker");
    const result = await t
      .withIdentity({ subject: speaker })
      .mutation(api.gameRounds.advanceSpeaker, { session_id: sessionId });
    if ("error" in result) throw new Error(`advanceSpeaker failed: ${result.error}`);
  }
  throw new Error("advanceToVoting looped too many times — something's stuck");
}

describe("F1c — disconnected current speaker is skipped early", () => {
  test("goOffline for the current speaker ends their turn immediately, not after the full 30s", async () => {
    const t = convexTest(schema, modules);
    const seeded = await seatUsers(t, "s", 4);
    const sessionId = seeded[0].session_id;

    const started = await t.withIdentity({ subject: "s_0" }).mutation(api.gameRounds.startRound, {
      session_id: sessionId,
    });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

    const before = await getRoundViewAs(t, "s_0", sessionId);
    expect(before?.status).toBe("speaking");
    const speaker = before!.current_speaker_user_id!;
    const turnExpiresAtBefore = before!.turn_expires_at!;

    await t.withIdentity({ subject: speaker }).mutation(api.gamePresence.goOffline, {
      session_id: sessionId,
    });

    const after = await getRoundViewAs(t, "s_0", sessionId);
    // Either moved to the next speaker (with a fresh, later deadline) or,
    // if the disconnected player happened to be last in speaking order,
    // wrapped straight to "voting" — either way, something moved, and it
    // moved without any 30s having elapsed (fake/real timers were never
    // advanced in this test at all).
    if (after!.status === "speaking") {
      expect(after!.current_speaker_user_id).not.toBe(speaker);
      expect(after!.turn_expires_at).not.toBe(turnExpiresAtBefore);
    } else {
      expect(after!.status).toBe("voting");
    }

    const players = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    expect(players.find((p) => p.user_id === speaker)?.connected).toBe(false);
  });

  test("goOffline for a player who ISN'T the current speaker doesn't touch the turn", async () => {
    const t = convexTest(schema, modules);
    const seeded = await seatUsers(t, "n", 4);
    const sessionId = seeded[0].session_id;

    const started = await t.withIdentity({ subject: "n_0" }).mutation(api.gameRounds.startRound, {
      session_id: sessionId,
    });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

    const before = await getRoundViewAs(t, "n_0", sessionId);
    const speaker = before!.current_speaker_user_id!;
    const bystander = before!.speaking_order.find((id) => id !== speaker)!;

    await t.withIdentity({ subject: bystander }).mutation(api.gamePresence.goOffline, {
      session_id: sessionId,
    });

    const after = await getRoundViewAs(t, "n_0", sessionId);
    expect(after!.status).toBe("speaking");
    expect(after!.current_speaker_user_id).toBe(speaker);
    expect(after!.turn_expires_at).toBe(before!.turn_expires_at);
  });

  test("the original scheduled auto-advance job for the skipped turn is a safe no-op once F1c has already moved things along", async () => {
    vi.useFakeTimers();
    try {
      const t = convexTest(schema, modules);
      const seeded = await seatUsers(t, "o", 4);
      const sessionId = seeded[0].session_id;

      const started = await t.withIdentity({ subject: "o_0" }).mutation(api.gameRounds.startRound, {
        session_id: sessionId,
      });
      if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

      const before = await getRoundViewAs(t, "o_0", sessionId);
      const speaker = before!.current_speaker_user_id!;
      const originalTurnExpiresAt = before!.turn_expires_at!;

      // Let 10s of (fake) time pass before the skip, so the freshly
      // scheduled turn (deadline computed at skip time) lands meaningfully
      // later than the original one being replaced — otherwise, with fake
      // timers frozen, both deadlines would compute to the same instant and
      // there'd be no way to advance past one without also passing the
      // other (a fake-timer-only artifact; real wall-clock time always
      // moves between two calls).
      await vi.advanceTimersByTimeAsync(10_000);

      await t.withIdentity({ subject: speaker }).mutation(api.gamePresence.goOffline, {
        session_id: sessionId,
      });

      const afterSkip = await getRoundViewAs(t, "o_0", sessionId);

      // Drive the fake clock just past the ORIGINAL turn's deadline — far
      // enough to fire its stale job, not far enough to reach the freshly
      // scheduled (10s-later) real deadline for o_1's new turn.
      const delay = Math.max(0, originalTurnExpiresAt - Date.now()) + 1_000;
      await vi.advanceTimersByTimeAsync(delay);

      const afterOriginalDeadline = await getRoundViewAs(t, "o_0", sessionId);
      expect(afterOriginalDeadline?.status).toBe(afterSkip?.status);
      if (afterSkip?.status === "speaking") {
        expect(afterOriginalDeadline?.current_speaker_user_id).toBe(afterSkip.current_speaker_user_id);
        expect(afterOriginalDeadline?.turn_expires_at).toBe(afterSkip.turn_expires_at);
      }
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("F1d — a disconnected voter no longer blocks auto-reveal", () => {
  test("disconnecting the only remaining non-voter triggers reveal on its own", async () => {
    const t = convexTest(schema, modules);
    const seeded = await seatUsers(t, "v", 3);
    const sessionId = seeded[0].session_id;

    const started = await t.withIdentity({ subject: "v_0" }).mutation(api.gameRounds.startRound, {
      session_id: sessionId,
    });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

    await advanceToVoting(t, "v_0", sessionId);
    const voting = await getRoundViewAs(t, "v_0", sessionId);
    expect(voting?.status).toBe("voting");

    const [a, b, c] = voting!.speaking_order;

    const voteA = await t.withIdentity({ subject: a }).mutation(api.gameRounds.castVote, {
      session_id: sessionId,
      voted_for_id: b,
    });
    if ("error" in voteA) throw new Error(voteA.error);
    expect(voteA.allVoted).toBe(false);

    const voteB = await t.withIdentity({ subject: b }).mutation(api.gameRounds.castVote, {
      session_id: sessionId,
      voted_for_id: a,
    });
    if ("error" in voteB) throw new Error(voteB.error);
    expect(voteB.allVoted).toBe(false);

    // c is the only one left to vote — still required and still connected,
    // so the round should still be sitting in "voting" at this point.
    const stillVoting = await getRoundViewAs(t, "v_0", sessionId);
    expect(stillVoting?.status).toBe("voting");

    // c disconnects instead of voting. c is now excluded from the required
    // roster, and a/b (the only remaining required voters) have already
    // voted — this alone should trigger reveal, with no further castVote
    // call from anyone.
    await t.withIdentity({ subject: c }).mutation(api.gamePresence.goOffline, {
      session_id: sessionId,
    });

    const revealed = await getRoundViewAs(t, "v_0", sessionId);
    expect(revealed?.status).toBe("revealed");
    expect(revealed?.reveal).not.toBeNull();
  });

  test("a vote cast before disconnecting still counts in the tally, even though the voter stops being required afterward", async () => {
    const t = convexTest(schema, modules);
    const seeded = await seatUsers(t, "w", 3);
    const sessionId = seeded[0].session_id;

    const started = await t.withIdentity({ subject: "w_0" }).mutation(api.gameRounds.startRound, {
      session_id: sessionId,
    });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

    await advanceToVoting(t, "w_0", sessionId);
    const voting = await getRoundViewAs(t, "w_0", sessionId);
    const [a, b, c] = voting!.speaking_order;

    // c votes for a, then disconnects — c's vote should survive even though
    // c is no longer required to be among the voters for reveal purposes.
    const voteC = await t.withIdentity({ subject: c }).mutation(api.gameRounds.castVote, {
      session_id: sessionId,
      voted_for_id: a,
    });
    if ("error" in voteC) throw new Error(voteC.error);
    expect(voteC.allVoted).toBe(false);

    await t.withIdentity({ subject: c }).mutation(api.gamePresence.goOffline, {
      session_id: sessionId,
    });
    // a and b haven't voted yet — shouldn't reveal from the disconnect alone.
    const stillVoting = await getRoundViewAs(t, "w_0", sessionId);
    expect(stillVoting?.status).toBe("voting");

    const voteA = await t.withIdentity({ subject: a }).mutation(api.gameRounds.castVote, {
      session_id: sessionId,
      voted_for_id: b,
    });
    if ("error" in voteA) throw new Error(voteA.error);

    const voteB = await t.withIdentity({ subject: b }).mutation(api.gameRounds.castVote, {
      session_id: sessionId,
      voted_for_id: a,
    });
    if ("error" in voteB) throw new Error(voteB.error);
    expect(voteB.allVoted).toBe(true);

    const revealed = await getRoundViewAs(t, "w_0", sessionId);
    expect(revealed?.status).toBe("revealed");
    // c's vote for `a` should still show up in the aggregate vote counts —
    // disconnecting doesn't erase an already-cast vote, it only stops
    // requiring a *future* one.
    expect(revealed?.reveal?.accusation.voteCounts[a]).toBeGreaterThanOrEqual(1);
  });

  test("every required voter disconnecting at once reveals with whatever votes exist, including zero", async () => {
    const t = convexTest(schema, modules);
    const seeded = await seatUsers(t, "z", 3);
    const sessionId = seeded[0].session_id;

    const started = await t.withIdentity({ subject: "z_0" }).mutation(api.gameRounds.startRound, {
      session_id: sessionId,
    });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

    await advanceToVoting(t, "z_0", sessionId);
    const voting = await getRoundViewAs(t, "z_0", sessionId);
    const [a, b, c] = voting!.speaking_order;

    await t.withIdentity({ subject: a }).mutation(api.gamePresence.goOffline, { session_id: sessionId });
    expect((await getRoundViewAs(t, "z_0", sessionId))?.status).toBe("voting");

    await t.withIdentity({ subject: b }).mutation(api.gamePresence.goOffline, { session_id: sessionId });
    expect((await getRoundViewAs(t, "z_0", sessionId))?.status).toBe("voting");

    await t.withIdentity({ subject: c }).mutation(api.gamePresence.goOffline, { session_id: sessionId });
    const revealed = await getRoundViewAs(t, "z_0", sessionId);
    expect(revealed?.status).toBe("revealed");
    expect(revealed?.reveal?.playersWon).toBe(false); // zero votes -> off-signal evades
  });
});

// Sanity check that DEFAULT_TURN_DURATION_MS is imported for a reason — the
// "no timers advanced at all" framing in this file's F1c tests only proves
// something if that duration is actually non-trivial.
test("DEFAULT_TURN_DURATION_MS sanity", () => {
  expect(DEFAULT_TURN_DURATION_MS).toBeGreaterThan(0);
});
