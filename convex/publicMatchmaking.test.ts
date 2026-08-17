/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import { describe, test, expect } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

/**
 * D2c — race-condition guard, made explicit and verified.
 *
 * Per SIGNAL_PROGRESS.md's D1/D2a/D2b notes, this is NOT "add safety from
 * scratch": `publicMatchmaking.ts`'s own header already argues that Convex's
 * mutations are isolated, serializable transactions, so two concurrent
 * `findOrCreatePublicSession` calls touching the same nearly-full room can't
 * both land and overshoot `capacity`. D2c's job (per orbital_1.md's own done
 * condition) is to *demonstrate* that property against real execution, not
 * just assert it in a comment — and to confirm it still holds now that D2a
 * (lock-on-full) and D2b (lock-on-start) both added a second/third write
 * path to the same `gameSessions` row that D1 originally reasoned about
 * before those writes existed.
 *
 * WHY THIS IS A GENUINE EXECUTION TEST, NOT ANOTHER TYPECHECK-ONLY PASS:
 * every session since B1 has carried a caveat that nothing in convex/ has
 * ever actually been run — no live Convex deployment was available in this
 * sandbox. `convex-test` (added as a devDependency this session) runs the
 * real mutation handlers against a simulated backend that has its own
 * transaction-serialization lock (see its `TransactionManager` — it takes a
 * mutex per top-level mutation, same as a real Convex deployment only ever
 * running one mutation at a time), so firing two `findOrCreatePublicSession`
 * calls via `Promise.all` here is a faithful test of "two near-simultaneous
 * joins on the last open seat," not a hand-rolled mock of what Convex
 * *should* do.
 *
 * Run with `npx vitest run convex/publicMatchmaking.test.ts`.
 */

const modules = import.meta.glob("./**/*.ts");

/** Seats `count` distinct fresh users into public matchmaking, sequentially. */
async function seatUsers(
  t: ReturnType<typeof convexTest>,
  namePrefix: string,
  count: number,
) {
  const results: Array<{ session_id: string }> = [];
  for (let i = 0; i < count; i++) {
    const asUser = t.withIdentity({ subject: `${namePrefix}_${i}` });
    const result = await asUser.mutation(
      api.publicMatchmaking.findOrCreatePublicSession,
      {},
    );
    if ("error" in result) {
      throw new Error(`Unexpected seating error for ${namePrefix}_${i}: ${result.error}`);
    }
    results.push(result);
  }
  return results;
}

describe("D2c — public matchmaking concurrency guard", () => {
  test("two concurrent joins on the last open seat never overshoot capacity", async () => {
    const t = convexTest(schema, modules);

    // Fill a public room to capacity - 1 (9 of 10), sequentially, so it's
    // definitely still "waiting" and definitely has exactly one open seat.
    const seeded = await seatUsers(t, "seed", 9);
    const targetSessionId = seeded[0].session_id;
    expect(seeded.every((s) => s.session_id === targetSessionId)).toBe(true);

    const before = await t.query(api.gameSessions.getSessionById, {
      session_id: targetSessionId,
    });
    expect(before?.status).toBe("waiting");
    const playersBefore = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: targetSessionId,
    });
    expect(playersBefore).toHaveLength(9);

    // Two *different* users race for the last seat at the same time.
    const raceA = t.withIdentity({ subject: "racer_a" });
    const raceB = t.withIdentity({ subject: "racer_b" });
    const [resultA, resultB] = await Promise.all([
      raceA.mutation(api.publicMatchmaking.findOrCreatePublicSession, {}),
      raceB.mutation(api.publicMatchmaking.findOrCreatePublicSession, {}),
    ]);

    if ("error" in resultA) throw new Error(`racer_a got an error: ${resultA.error}`);
    if ("error" in resultB) throw new Error(`racer_b got an error: ${resultB.error}`);

    // Exactly one of the two must have taken the last seat in the
    // now-full room; the other must have been correctly routed elsewhere
    // (a different session — matchmaking's own job when the room it looked
    // at is no longer open) rather than also being crammed into the same
    // session id.
    const landedInTarget = [resultA, resultB].filter(
      (r) => r.session_id === targetSessionId,
    );
    expect(landedInTarget).toHaveLength(1);

    const overflowResult = resultA.session_id === targetSessionId ? resultB : resultA;
    expect(overflowResult.session_id).not.toBe(targetSessionId);

    // The core done-condition: capacity is never overshot, no matter what.
    const finalPlayers = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: targetSessionId,
    });
    expect(finalPlayers.length).toBeLessThanOrEqual(10);
    expect(finalPlayers).toHaveLength(10);

    // And it correctly produced a "locked" session, per D2a, exactly once
    // it actually hit capacity — not before, not left stuck at "waiting".
    const finalSession = await t.query(api.gameSessions.getSessionById, {
      session_id: targetSessionId,
    });
    expect(finalSession?.status).toBe("locked");

    // No duplicate/ghost rows: every seated user_id in the final room is
    // unique (a real overshoot bug could plausibly double-insert instead of
    // just over-counting).
    const uniqueUserIds = new Set(finalPlayers.map((p) => p.user_id));
    expect(uniqueUserIds.size).toBe(finalPlayers.length);

    // The overflowed racer landed somewhere real and joinable, not in limbo.
    const overflowSession = await t.query(api.gameSessions.getSessionById, {
      session_id: overflowResult.session_id,
    });
    expect(overflowSession).not.toBeNull();
    expect(overflowSession?.mode).toBe("public");
    const overflowPlayers = await t.query(api.gameSessions.getSessionPlayers, {
      session_id: overflowResult.session_id,
    });
    expect(overflowPlayers.map((p) => p.user_id)).toContain(
      overflowResult.session_id === resultA.session_id ? "racer_a" : "racer_b",
    );
  });

  test("five-way pile-on for one open seat still never overshoots, across N racers", async () => {
    const t = convexTest(schema, modules);

    const seeded = await seatUsers(t, "seed2", 9);
    const lockedSessionId = seeded[0].session_id;

    // One more sequential (non-racing) join brings this room to capacity
    // and should lock it — a quick re-confirmation of lock-on-full outside
    // the race itself, so the assertions below about racers landing
    // *elsewhere* rest on a room that's genuinely already full and locked
    // going into the pile-on, not an assumption about it.
    const probe = await seatUsers(t, "probe", 1);
    expect(probe[0].session_id).toBe(lockedSessionId);
    const lockedSession = await t.query(api.gameSessions.getSessionById, {
      session_id: lockedSessionId,
    });
    expect(lockedSession?.status).toBe("locked");

    // Five more users all try to matchmake "at once" — none of them can
    // land in the now-locked room; matchmaking must route every one of
    // them into open seats without ever double-seating the same room past
    // capacity, and without any of them erroring or getting lost.
    const racers = ["p1", "p2", "p3", "p4", "p5"].map((name) =>
      t.withIdentity({ subject: name }),
    );
    const results = await Promise.all(
      racers.map((r) => r.mutation(api.publicMatchmaking.findOrCreatePublicSession, {})),
    );
    for (const r of results) {
      if ("error" in r) throw new Error(`Unexpected matchmaking error: ${r.error}`);
      expect(r.session_id).not.toBe(lockedSessionId);
    }

    // Every session any racer landed in must independently respect capacity.
    const touchedSessionIds = new Set(results.map((r) => ("session_id" in r ? r.session_id : "")));
    for (const sessionId of touchedSessionIds) {
      const players = await t.query(api.gameSessions.getSessionPlayers, {
        session_id: sessionId,
      });
      const uniqueIds = new Set(players.map((p) => p.user_id));
      expect(uniqueIds.size).toBe(players.length); // no duplicate seats
      expect(players.length).toBeLessThanOrEqual(10); // never overshoot
    }

    // And all 5 racers are actually seated somewhere, collectively — no one
    // silently dropped by the race.
    const allSeatedUserIds = new Set<string>();
    for (const sessionId of touchedSessionIds) {
      const players = await t.query(api.gameSessions.getSessionPlayers, {
        session_id: sessionId,
      });
      players.forEach((p) => allSeatedUserIds.add(p.user_id));
    }
    for (const name of ["p1", "p2", "p3", "p4", "p5"]) {
      expect(allSeatedUserIds.has(name)).toBe(true);
    }
  });
});
