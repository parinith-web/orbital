/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { describe, test, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { WINNING_SCORE } from "./games/lobbyConfig";

// `T` loses the concrete schema (convexTest is
// generic, so an un-inferred `ReturnType` falls back to an empty/system-only
// DataModel) — that's fine for helpers that only ever call `t.query`/
// `t.mutation` against the generated `api` object, but breaks type-checking
// for any helper that does a raw `ctx.db.query(...).withIndex(...)` inside
// `t.run`. Those helpers below use this alias instead, which threads the
// actual imported `schema`'s types through.
type T = TestConvex<typeof schema>;

/**
 * H9 — score-threshold (H2) end-condition coverage. Nothing in the existing
 * suite drives a real reveal past `WINNING_SCORE`, so none of this behavior
 * (documented in `gameRounds.ts`'s `performReveal`) had a test actually
 * exercising it before this session.
 *
 * Scores are seeded directly via `t.run` rather than played out over ~10
 * real rounds — the thing under test is "what happens when a reveal pushes
 * a score across the threshold," not the round-by-round scoring path itself
 * (already covered by `games/testHarness.ts`'s voting scenarios). Seeding
 * puts every scenario exactly one reveal away from the interesting case.
 *
 * Run with `npx vitest run convex/gameWinCondition.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

async function createRoomWithPlayers(
  t: T,
  host: string,
  guests: string[],
) {
  const created = await t.withIdentity({ subject: host }).mutation(api.gameRoomCode.createGameRoom, {});
  if ("error" in created) throw new Error(created.error);

  for (const guest of guests) {
    const joined = await t
      .withIdentity({ subject: guest })
      .mutation(api.gameRoomCode.joinGameRoomByCode, { join_code: created.join_code });
    if ("error" in joined) throw new Error(joined.error);
  }

  return created;
}

/** Directly sets a player's score, bypassing normal reveal scoring. */
async function setScore(t: T, sessionId: string, userId: string, score: number) {
  await t.run(async (ctx) => {
    const row = await ctx.db
      .query("gamePlayers")
      .withIndex("by_user_session", (q) => q.eq("user_id", userId).eq("session_id", sessionId))
      .first();
    if (!row) throw new Error(`No gamePlayers row for ${userId} in ${sessionId}`);
    await ctx.db.patch(row._id, { score });
  });
}

/**
 * Drives the current round from "speaking" to "voting" via real
 * advanceSpeaker calls. `getRoundView` requires an authenticated caller
 * (returns null otherwise), so this reads it as `queryAsSubject` — any
 * player already seated in the session works, this is a read-only view.
 */
async function speakThroughToVoting(
  t: T,
  sessionId: string,
  queryAsSubject: string,
) {
  for (let guard = 0; guard < 20; guard++) {
    const view = await t.withIdentity({ subject: queryAsSubject }).query(api.gameRounds.getRoundView, {
      session_id: sessionId,
    });
    if (!view || view.status !== "speaking") return view;
    const speaker = view.current_speaker_user_id!;
    const result = await t
      .withIdentity({ subject: speaker })
      .mutation(api.gameRounds.advanceSpeaker, { session_id: sessionId });
    if ("error" in result) throw new Error(`advanceSpeaker failed: ${result.error}`);
  }
  throw new Error("speakThroughToVoting: guard exceeded, never reached voting");
}

describe("H2/H9 — score-threshold end condition", () => {
  test("a single player's reveal-driven score crossing WINNING_SCORE ends the session", async () => {
    const t = convexTest(schema, modules);
    const players = ["w_host", "w_g1", "w_g2", "w_g3"];
    const created = await createRoomWithPlayers(t, players[0], players.slice(1));
    const sessionId = created.session_id;

    // Seat everyone at 8 except the eventual off-signal player, who sits at
    // 0 — irrelevant to who wins here, this test only cares about the
    // *voters* crossing the line.
    for (const p of players) await setScore(t, sessionId, p, 8);

    const started = await t.withIdentity({ subject: players[0] }).mutation(api.gameRounds.startRound, {
      session_id: sessionId,
    });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);

    const voting = await speakThroughToVoting(t, sessionId, players[0]);
    expect(voting?.status).toBe("voting");
    // getRoundView redacts who's off-signal from other players; read it
    // straight from the round row instead, since this test needs ground truth.
    const roundRow = await t.run(async (ctx) =>
      (await ctx.db.query("gameRounds").withIndex("by_session_id", (q) => q.eq("session_id", sessionId)).collect()).find(
        (r) => r.round_number === voting!.round_number,
      ),
    );
    if (!roundRow) throw new Error("round row not found");
    const trueOffSignal = roundRow.offsignal_user_id;
    const voters = players.filter((p) => p !== trueOffSignal);

    // Every voter (already at score 8) correctly accuses the off-signal
    // player -> each gets +1 -> every voter's score crosses 10... well,
    // reaches 9. Bump the seed to 9 so a single +1 clears WINNING_SCORE (10).
    for (const p of players) await setScore(t, sessionId, p, WINNING_SCORE - 1);

    let lastResult: unknown = null;
    for (const voter of voters) {
      lastResult = await t.withIdentity({ subject: voter }).mutation(api.gameRounds.castVote, {
        session_id: sessionId,
        voted_for_id: trueOffSignal,
      });
    }
    // Off-signal player also votes (required), for anyone not the sole
    // remaining voter, so `allVoted` actually triggers.
    if (voters.length < players.length) {
      lastResult = await t.withIdentity({ subject: trueOffSignal }).mutation(api.gameRounds.castVote, {
        session_id: sessionId,
        voted_for_id: voters[0],
      });
    }
    expect((lastResult as { allVoted?: boolean }).allVoted).toBe(true);

    const finalSession = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(finalSession?.status).toBe("ended");

    const events = await t.run(async (ctx) => ctx.db.query("gameEvents").collect());
    const endedEvents = events.filter((e) => e.event_type === "session_ended");
    expect(endedEvents).toHaveLength(1);
    expect(endedEvents[0].session_id).toBe(sessionId);
    expect(voters).toContain(endedEvents[0].user_id);
  });

  test("scores below WINNING_SCORE after a reveal leave the session in progress", async () => {
    const t = convexTest(schema, modules);
    const players = ["w2_host", "w2_g1", "w2_g2"];
    const created = await createRoomWithPlayers(t, players[0], players.slice(1));
    const sessionId = created.session_id;
    for (const p of players) await setScore(t, sessionId, p, 3);

    const started = await t.withIdentity({ subject: players[0] }).mutation(api.gameRounds.startRound, {
      session_id: sessionId,
    });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);
    await speakThroughToVoting(t, sessionId, players[0]);

    const roundRow = await t.run(async (ctx) => {
      const rounds = await ctx.db.query("gameRounds").withIndex("by_session_id", (q) => q.eq("session_id", sessionId)).collect();
      return rounds[rounds.length - 1];
    });
    const trueOffSignal = roundRow.offsignal_user_id;
    const voters = players.filter((p) => p !== trueOffSignal);

    for (const voter of voters) {
      await t.withIdentity({ subject: voter }).mutation(api.gameRounds.castVote, {
        session_id: sessionId,
        voted_for_id: trueOffSignal,
      });
    }

    const finalSession = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    // Voters went from 3 -> 4, off-signal player stayed at 3. Nobody's near
    // WINNING_SCORE, so the session must still be live.
    expect(finalSession?.status).not.toBe("ended");

    const events = await t.run(async (ctx) => ctx.db.query("gameEvents").collect());
    expect(events.filter((e) => e.event_type === "session_ended")).toHaveLength(0);
  });

  test("simultaneous multi-winner: several voters crossing WINNING_SCORE in the same reveal still ends the game exactly once", async () => {
    const t = convexTest(schema, modules);
    const players = ["w3_host", "w3_g1", "w3_g2", "w3_g3", "w3_g4"];
    const created = await createRoomWithPlayers(t, players[0], players.slice(1));
    const sessionId = created.session_id;

    const started = await t.withIdentity({ subject: players[0] }).mutation(api.gameRounds.startRound, {
      session_id: sessionId,
    });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);
    await speakThroughToVoting(t, sessionId, players[0]);

    const roundRow = await t.run(async (ctx) => {
      const rounds = await ctx.db.query("gameRounds").withIndex("by_session_id", (q) => q.eq("session_id", sessionId)).collect();
      return rounds[rounds.length - 1];
    });
    const trueOffSignal = roundRow.offsignal_user_id;
    const voters = players.filter((p) => p !== trueOffSignal);

    // Seed every voter at exactly WINNING_SCORE - 1 so a clean +1 for a
    // correct accusation pushes ALL of them past the line in the same
    // reveal — the "several players each score +1 in the same round" case
    // portal_1.md's own H2 line calls out.
    for (const voter of voters) await setScore(t, sessionId, voter, WINNING_SCORE - 1);
    await setScore(t, sessionId, trueOffSignal, 0);

    let lastResult: unknown = null;
    for (const voter of voters) {
      lastResult = await t.withIdentity({ subject: voter }).mutation(api.gameRounds.castVote, {
        session_id: sessionId,
        voted_for_id: trueOffSignal,
      });
    }
    // The off-signal player is also a connected required voter (they can
    // vote for someone else, it just can't be themselves) — without this,
    // `allVoted` never flips and the reveal never fires.
    lastResult = await t.withIdentity({ subject: trueOffSignal }).mutation(api.gameRounds.castVote, {
      session_id: sessionId,
      voted_for_id: voters[0],
    });
    expect((lastResult as { allVoted?: boolean }).allVoted).toBe(true);

    const finalPlayers = await t.query(api.gameSessions.getSessionPlayers, { session_id: sessionId });
    const finalVoterScores = finalPlayers.filter((p) => voters.includes(p.user_id)).map((p) => p.score);
    expect(finalVoterScores.every((s) => s >= WINNING_SCORE)).toBe(true);

    const finalSession = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(finalSession?.status).toBe("ended");

    // Exactly one session_ended event, even though multiple players crossed
    // the line in the same reveal — no per-winner duplicate logging.
    const events = await t.run(async (ctx) => ctx.db.query("gameEvents").collect());
    expect(events.filter((e) => e.event_type === "session_ended")).toHaveLength(1);

    // The leaderboard should show every winner tied at rank 1 — ended-state
    // ranking, not the ending logic itself, but worth confirming the two
    // features agree on the ground truth once the game is actually over.
    const leaderboard = await t.query(api.gameSessions.getLeaderboard, { session_id: sessionId });
    const rank1 = leaderboard.filter((row) => row.rank === 1);
    expect(rank1.length).toBe(voters.length);
    expect(rank1.every((row) => row.score >= WINNING_SCORE)).toBe(true);
  });

  test("the threshold applies uniformly to public-mode sessions too, not just private/room-code ones", async () => {
    const t = convexTest(schema, modules);
    const subjects = ["pw_0", "pw_1", "pw_2", "pw_3"];
    let sessionId = "";
    for (const subject of subjects) {
      const result = await t.withIdentity({ subject }).mutation(api.publicMatchmaking.findOrCreatePublicSession, {});
      if ("error" in result) throw new Error(result.error);
      sessionId = result.session_id;
    }
    expect(sessionId).not.toBe("");

    const session = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(session?.mode).toBe("public");

    const started = await t.withIdentity({ subject: subjects[0] }).mutation(api.gameRounds.startRound, {
      session_id: sessionId,
    });
    if ("error" in started) throw new Error(`startRound failed: ${started.error}`);
    await speakThroughToVoting(t, sessionId, subjects[0]);

    const roundRow = await t.run(async (ctx) => {
      const rounds = await ctx.db.query("gameRounds").withIndex("by_session_id", (q) => q.eq("session_id", sessionId)).collect();
      return rounds[rounds.length - 1];
    });
    const trueOffSignal = roundRow.offsignal_user_id;
    const voters = subjects.filter((s) => s !== trueOffSignal);
    for (const voter of voters) await setScore(t, sessionId, voter, WINNING_SCORE - 1);

    for (const voter of voters) {
      await t.withIdentity({ subject: voter }).mutation(api.gameRounds.castVote, {
        session_id: sessionId,
        voted_for_id: trueOffSignal,
      });
    }
    await t.withIdentity({ subject: trueOffSignal }).mutation(api.gameRounds.castVote, {
      session_id: sessionId,
      voted_for_id: voters[0],
    });

    const finalSession = await t.query(api.gameSessions.getSessionById, { session_id: sessionId });
    expect(finalSession?.status).toBe("ended");
  });
});
