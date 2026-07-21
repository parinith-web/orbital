/// <reference types="vite/client" />
import { convexTest, type TestConvex } from "convex-test";
import { describe, test, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

/**
 * H3/H9 — `getLeaderboard` math. No existing test called this query
 * directly before this session; `Leaderboard.tsx`'s own doc comment
 * describes standard competition ranking (1, 1, 3 — not dense 1, 1, 2) and
 * "offsignal_count is supporting context only, never a ranking factor,"
 * neither of which had a test actually pinning it down.
 *
 * Run with `npx vitest run convex/gameLeaderboard.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");
type T = TestConvex<typeof schema>;

async function seatSessionWithScores(
  t: T,
  sessionId: string,
  roomId: string,
  players: Array<{ user_id: string; score: number; offsignal_count?: number }>,
) {
  await t.run(async (ctx) => {
    await ctx.db.insert("rooms", { room_id: roomId, room_name: "Leaderboard Test Room", is_group: true });
    for (const p of players) {
      await ctx.db.insert("roomMembers", {
        room_id: roomId,
        user_id: p.user_id,
        role: "member",
        username: p.user_id,
      });
    }
    await ctx.db.insert("gameSessions", {
      session_id: sessionId,
      room_id: roomId,
      mode: "private",
      status: "ended",
      capacity: 10,
      current_round: 1,
      created_at: Date.now(),
    });
    for (const p of players) {
      await ctx.db.insert("gamePlayers", {
        session_id: sessionId,
        user_id: p.user_id,
        username: p.user_id,
        score: p.score,
        offsignal_count: p.offsignal_count,
      });
    }
  });
}

describe("H3/H9 — getLeaderboard", () => {
  test("sorts by score descending, no ties", async () => {
    const t = convexTest(schema, modules);
    await seatSessionWithScores(t, "lb_1", "lb_room_1", [
      { user_id: "low", score: 2 },
      { user_id: "high", score: 10 },
      { user_id: "mid", score: 6 },
    ]);

    const leaderboard = await t.query(api.gameSessions.getLeaderboard, { session_id: "lb_1" });
    expect(leaderboard.map((row) => row.user_id)).toEqual(["high", "mid", "low"]);
    expect(leaderboard.map((row) => row.rank)).toEqual([1, 2, 3]);
  });

  test("a tie at the top uses standard competition ranking (1, 1, 3 — not dense 1, 1, 2)", async () => {
    const t = convexTest(schema, modules);
    await seatSessionWithScores(t, "lb_2", "lb_room_2", [
      { user_id: "tied_a", score: 10 },
      { user_id: "tied_b", score: 10 },
      { user_id: "third", score: 7 },
    ]);

    const leaderboard = await t.query(api.gameSessions.getLeaderboard, { session_id: "lb_2" });
    const byId = Object.fromEntries(leaderboard.map((row) => [row.user_id, row]));
    expect(byId.tied_a.rank).toBe(1);
    expect(byId.tied_b.rank).toBe(1);
    // The player right after a two-way tie for 1st is rank 3, not rank 2 —
    // the whole point of competition ranking vs. dense ranking.
    expect(byId.third.rank).toBe(3);
  });

  test("a tie in the middle of the pack still skips the right number of ranks", async () => {
    const t = convexTest(schema, modules);
    await seatSessionWithScores(t, "lb_3", "lb_room_3", [
      { user_id: "first", score: 10 },
      { user_id: "tied_a", score: 5 },
      { user_id: "tied_b", score: 5 },
      { user_id: "tied_c", score: 5 },
      { user_id: "last", score: 1 },
    ]);

    const leaderboard = await t.query(api.gameSessions.getLeaderboard, { session_id: "lb_3" });
    const byId = Object.fromEntries(leaderboard.map((row) => [row.user_id, row]));
    expect(byId.first.rank).toBe(1);
    expect(byId.tied_a.rank).toBe(2);
    expect(byId.tied_b.rank).toBe(2);
    expect(byId.tied_c.rank).toBe(2);
    // Three-way tie for 2nd -> next distinct score is rank 5, not rank 3.
    expect(byId.last.rank).toBe(5);
  });

  test("everyone tied at the same score all share rank 1", async () => {
    const t = convexTest(schema, modules);
    await seatSessionWithScores(t, "lb_4", "lb_room_4", [
      { user_id: "a", score: 4 },
      { user_id: "b", score: 4 },
      { user_id: "c", score: 4 },
    ]);

    const leaderboard = await t.query(api.gameSessions.getLeaderboard, { session_id: "lb_4" });
    expect(leaderboard.every((row) => row.rank === 1)).toBe(true);
  });

  test("offsignal_count rides along as context but never affects sort order or rank", async () => {
    const t = convexTest(schema, modules);
    // Deliberately give the higher-offsignal_count player a LOWER score, so
    // if offsignal_count ever leaked into the sort/rank the wrong player
    // would land on top.
    await seatSessionWithScores(t, "lb_5", "lb_room_5", [
      { user_id: "many_imposter_low_score", score: 3, offsignal_count: 9 },
      { user_id: "no_imposter_high_score", score: 10, offsignal_count: 0 },
    ]);

    const leaderboard = await t.query(api.gameSessions.getLeaderboard, { session_id: "lb_5" });
    expect(leaderboard[0].user_id).toBe("no_imposter_high_score");
    expect(leaderboard[0].rank).toBe(1);
    expect(leaderboard[0].offsignal_count).toBe(0);
    expect(leaderboard[1].user_id).toBe("many_imposter_low_score");
    expect(leaderboard[1].offsignal_count).toBe(9);
  });

  test("a missing offsignal_count defaults to 0 rather than undefined/null", async () => {
    const t = convexTest(schema, modules);
    await seatSessionWithScores(t, "lb_6", "lb_room_6", [{ user_id: "solo", score: 5 }]);

    const leaderboard = await t.query(api.gameSessions.getLeaderboard, { session_id: "lb_6" });
    expect(leaderboard[0].offsignal_count).toBe(0);
  });

  test("is scoped to its own session only — a same-room rematch's fresh session doesn't leak the old one's rows", async () => {
    const t = convexTest(schema, modules);
    await seatSessionWithScores(t, "lb_7_old", "lb_room_7", [
      { user_id: "alice", score: 10 },
      { user_id: "bob", score: 3 },
    ]);
    // A "rematch" session for the same room/roster, fresh scores.
    await seatSessionWithScores(t, "lb_7_new", "lb_room_7_b", [
      { user_id: "alice", score: 0 },
      { user_id: "bob", score: 0 },
    ]);

    const oldBoard = await t.query(api.gameSessions.getLeaderboard, { session_id: "lb_7_old" });
    const newBoard = await t.query(api.gameSessions.getLeaderboard, { session_id: "lb_7_new" });
    expect(oldBoard.find((r) => r.user_id === "alice")?.score).toBe(10);
    expect(newBoard.find((r) => r.user_id === "alice")?.score).toBe(0);
    expect(newBoard).toHaveLength(2);
  });

  test("an unknown session_id returns an empty leaderboard rather than throwing", async () => {
    const t = convexTest(schema, modules);
    const leaderboard = await t.query(api.gameSessions.getLeaderboard, { session_id: "does_not_exist" });
    expect(leaderboard).toEqual([]);
  });
});
