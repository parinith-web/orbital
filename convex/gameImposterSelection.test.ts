import { describe, test, expect } from "vitest";
import {
  assignRound,
  pickOffSignalPlayer,
  pickWordPair,
  WORD_BANK,
  type RandomSource,
} from "./games/wordAssignment";
import { WINNING_SCORE } from "./games/lobbyConfig";

/**
 * H1/H9 — uniform-random imposter selection, as a real vitest file.
 *
 * `games/testHarness.ts` (a plain `tsx`-run script, not picked up by
 * `vitest run`/`npm test` — see vitest.config.ts's `test.include` default
 * of `**\/*.{test,spec}.ts`) already has a "Scenario 7" covering roughly
 * this ground, but it was never actually part of the automated suite H9's
 * own plan line asks to extend. This file brings that coverage into
 * `npm test` itself, plus adds a statistical distribution check the
 * script's simple "covers the whole roster" assertion doesn't attempt.
 *
 * `pickOffSignalPlayer`/`assignRound` are pure functions (no Convex/db
 * involved — see wordAssignment.ts's own file header), so this needs no
 * `convex-test` setup at all.
 *
 * Run with `npx vitest run convex/gameImposterSelection.test.ts`.
 */

function makeSeededRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;
  return {
    next: () => {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 4294967296;
    },
  };
}

describe("H1/H9 — pickOffSignalPlayer: uniform-random selection", () => {
  test("throws below the 3-player minimum (defensive guard, not the UX-facing check)", () => {
    expect(() => pickOffSignalPlayer(["a", "b"], makeSeededRandomSource(1))).toThrow();
  });

  test("always returns a member of the roster", () => {
    const roster = ["alice", "bob", "carol", "dave", "erin"];
    const rng = makeSeededRandomSource(11);
    for (let i = 0; i < 100; i++) {
      expect(roster).toContain(pickOffSignalPlayer(roster, rng));
    }
  });

  test("uses Math.random by default when no RandomSource is injected", () => {
    // No 2nd argument -> defaultRandomSource (Math.random). Just confirms
    // the production call shape works without a caller having to always
    // supply a fake rng.
    const roster = ["alice", "bob", "carol"];
    expect(roster).toContain(pickOffSignalPlayer(roster));
  });

  test("every roster member gets picked across many draws — no structural exclusion or bias", () => {
    const roster = ["alice", "bob", "carol", "dave", "erin"];
    const rng = makeSeededRandomSource(42);
    const picked = new Set<string>();
    for (let i = 0; i < 300; i++) picked.add(pickOffSignalPlayer(roster, rng));
    expect([...picked].sort()).toEqual([...roster].sort());
  });

  test("distribution across many draws is roughly uniform, not skewed toward one player", () => {
    // A real statistical test (chi-square) would be overkill for a pure
    // uniform-index draw over a fixed-size array; this is a coarse sanity
    // bound instead — with N=5 players and 5000 draws, each player's
    // expected count is 1000. A structural bug (e.g. always favoring index
    // 0, or a modulo-bias bug) would blow well past a 40% band; a fair
    // draw won't, with astronomically low odds of a false failure.
    const roster = ["alice", "bob", "carol", "dave", "erin"];
    const rng = makeSeededRandomSource(7);
    const counts: Record<string, number> = Object.fromEntries(roster.map((p) => [p, 0]));
    const draws = 5000;
    for (let i = 0; i < draws; i++) counts[pickOffSignalPlayer(roster, rng)]++;

    const expected = draws / roster.length;
    const lowerBound = expected * 0.6;
    const upperBound = expected * 1.4;
    for (const player of roster) {
      expect(counts[player]).toBeGreaterThan(lowerBound);
      expect(counts[player]).toBeLessThan(upperBound);
    }
  });

  test("doesn't always return the same player on successive draws from one evolving rng", () => {
    const roster = ["alice", "bob", "carol", "dave", "erin"];
    const rng = makeSeededRandomSource(1);
    const firstFew = Array.from({ length: 10 }, () => pickOffSignalPlayer(roster, rng));
    expect(new Set(firstFew).size).toBeGreaterThan(1);
  });

  test("a 2-player roster (below minimum) still throws even with a real rng source", () => {
    expect(() => pickOffSignalPlayer(["solo1", "solo2"])).toThrow(/at least 3 players/);
  });
});

describe("H1/H9 — assignRound defers to pickOffSignalPlayer's plain random draw", () => {
  test("assignRound's off-signal pick matches a standalone pickOffSignalPlayer call under the same rng sequence", () => {
    const roster = ["alice", "bob", "carol", "dave"];
    const rngA = makeSeededRandomSource(7);
    const rngB = makeSeededRandomSource(7);

    pickWordPair(WORD_BANK, rngB); // assignRound burns one rng call on the word pair first
    const directPick = pickOffSignalPlayer(roster, rngB);
    const assignment = assignRound(roster, WORD_BANK, rngA);

    expect(assignment.offSignalUserId).toBe(directPick);
  });

  test("gives every player exactly one word, and the off-signal player's word differs from the rest", () => {
    const roster = ["alice", "bob", "carol", "dave", "erin"];
    const assignment = assignRound(roster, WORD_BANK, makeSeededRandomSource(99));

    expect(Object.keys(assignment.wordByUserId).sort()).toEqual([...roster].sort());
    expect(assignment.wordByUserId[assignment.offSignalUserId]).toBe(assignment.wordOffSignal);
    roster
      .filter((p) => p !== assignment.offSignalUserId)
      .forEach((p) => expect(assignment.wordByUserId[p]).toBe(assignment.wordMain));
  });

  test("across many rounds, no player is structurally excluded from ever being off-signal", () => {
    const roster = ["alice", "bob", "carol", "dave", "erin", "frank"];
    const rng = makeSeededRandomSource(2024);
    const picks = new Set<string>();
    for (let round = 0; round < 200; round++) {
      picks.add(assignRound(roster, WORD_BANK, rng).offSignalUserId);
    }
    expect([...picks].sort()).toEqual([...roster].sort());
  });
});

describe("H2/H9 — WINNING_SCORE constant sanity", () => {
  test("is the documented 10-point threshold", () => {
    // Guards against someone silently retuning the win condition without
    // updating the plan doc / product decision — see gameWinCondition.test.ts
    // for the behavioral (not just constant-value) coverage of H2 itself.
    expect(WINNING_SCORE).toBe(10);
  });
});
