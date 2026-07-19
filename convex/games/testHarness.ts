/**
 * A5 — Test harness exercising A2 (wordAssignment) + A3 (turnOrder) +
 * A4 (voting) end-to-end as one simulated round-cycle, entirely in-process
 * with no Convex/DB involved. Uses a seeded fake RandomSource so every run
 * is byte-for-byte deterministic — no flakiness, safe to diff across runs.
 *
 * Run with: npx tsx convex/games/testHarness.ts
 * Exit code 0 = all checks passed. Exit code 1 = at least one failed
 * (failures are printed with a [FAIL] marker and don't stop the run early,
 * so you see every failure in one pass rather than one-at-a-time).
 */

import {
  assignRound,
  pickOffSignalPlayer,
  pickWordPair,
  WORD_BANK,
  type RandomSource,
} from "./wordAssignment";
import {
  advanceSpeaker,
  computeTurnExpiry,
  generateSpeakingOrder,
  hasTurnExpired,
  shuffle,
} from "./turnOrder";
import {
  applyScoreDeltas,
  computeRoundResult,
  determineAccused,
  tallyVotes,
  type Vote,
} from "./voting";

// ---------------------------------------------------------------------------
// Deterministic RNG: simple seeded LCG so `next()` produces a reproducible
// sequence in [0, 1). Same seed -> same sequence -> same test outcome every
// run, which is the whole point (real gameplay uses defaultRandomSource).
// ---------------------------------------------------------------------------
function makeSeededRandomSource(seed: number): RandomSource {
  let state = seed >>> 0;
  return {
    next: () => {
      // Numerical Recipes LCG constants.
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 4294967296;
    },
  };
}

// ---------------------------------------------------------------------------
// Tiny assertion helpers. Collect failures instead of throwing on the first
// one, so a single run reports the full picture.
// ---------------------------------------------------------------------------
let passCount = 0;
let failCount = 0;

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    passCount++;
    console.log(`  [pass] ${label}`);
  } else {
    failCount++;
    console.error(`  [FAIL] ${label}${detail ? ` — ${detail}` : ""}`);
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function section(title: string): void {
  console.log(`\n${title}`);
}

// ---------------------------------------------------------------------------
// Scenario 1: full happy-path round-cycle for a 5-player session.
// create roster -> assign round -> speak through full order -> cast votes
// (majority correctly IDs the off-signal player) -> reveal -> apply scores.
// ---------------------------------------------------------------------------
function scenarioHappyPath(): void {
  section("Scenario 1: happy-path round cycle (5 players, correct accusation)");

  const players = ["alice", "bob", "carol", "dave", "erin"];
  const rng = makeSeededRandomSource(42);

  // A2: word + off-signal assignment
  const assignment = assignRound(players, WORD_BANK, rng);
  check(
    "assignRound picks an off-signal player from the roster",
    players.includes(assignment.offSignalUserId),
  );
  check(
    "assignRound gives every player exactly one word",
    Object.keys(assignment.wordByUserId).length === players.length,
  );
  check(
    "off-signal player's word differs from everyone else's",
    assignment.wordByUserId[assignment.offSignalUserId] === assignment.wordOffSignal &&
      players
        .filter((p) => p !== assignment.offSignalUserId)
        .every((p) => assignment.wordByUserId[p] === assignment.wordMain),
  );

  // A3: speaking order + full turn advancement
  const speakingOrder = generateSpeakingOrder(players, rng);
  check(
    "generateSpeakingOrder is a permutation of the roster",
    speakingOrder.length === players.length &&
      players.every((p) => speakingOrder.includes(p)),
  );

  let turnState = { speakingOrder, currentSpeakerIndex: -1 };
  let turnsTaken = 0;
  let isSpeakingComplete = false;
  while (!isSpeakingComplete) {
    const result = advanceSpeaker(turnState);
    isSpeakingComplete = result.isSpeakingComplete;
    if (!isSpeakingComplete) {
      turnsTaken++;
      turnState = { ...turnState, currentSpeakerIndex: result.nextSpeakerIndex };
    }
  }
  check(
    "advancing through the full order takes exactly N turns",
    turnsTaken === players.length,
    `expected ${players.length}, got ${turnsTaken}`,
  );

  const now = 1_000_000;
  const expiry = computeTurnExpiry(now);
  check("computeTurnExpiry adds the default duration", expiry === now + 30_000);
  check("hasTurnExpired is false before the deadline", !hasTurnExpired(now, expiry));
  check("hasTurnExpired is true at/after the deadline", hasTurnExpired(expiry, expiry));

  // A4: votes — majority correctly accuses the off-signal player
  const [offSignal, ...others] = [
    assignment.offSignalUserId,
    ...players.filter((p) => p !== assignment.offSignalUserId),
  ];
  const votes: Vote[] = others.map((voter) => ({
    voter_id: voter,
    voted_for_id: offSignal,
  }));
  // Off-signal player casts a (wasted) vote for someone else — doesn't change outcome.
  votes.push({ voter_id: offSignal, voted_for_id: others[0] });

  const result = computeRoundResult(votes, offSignal);
  check("playersWon is true on a clean majority accusation", result.playersWon === true);
  check(
    "every correct voter gets +1, off-signal gets nothing",
    deepEqual(
      new Set(result.scoreDeltas.map((d) => `${d.user_id}:${d.delta}`)),
      new Set(others.map((voter) => `${voter}:1`)),
    ),
  );

  const startingScores = Object.fromEntries(players.map((p) => [p, 0]));
  const updatedScores = applyScoreDeltas(startingScores, result.scoreDeltas);
  check(
    "applyScoreDeltas updates only the voters who guessed right",
    others.every((voter) => updatedScores[voter] === 1) && updatedScores[offSignal] === 0,
  );
}

// ---------------------------------------------------------------------------
// Scenario 2: tie at the top -> off-signal player evades.
// ---------------------------------------------------------------------------
function scenarioTieEvades(): void {
  section("Scenario 2: tied vote -> off-signal player evades");

  const offSignal = "erin";
  const votes: Vote[] = [
    { voter_id: "alice", voted_for_id: "bob" },
    { voter_id: "bob", voted_for_id: "carol" },
    { voter_id: "carol", voted_for_id: "bob" },
    { voter_id: "dave", voted_for_id: "carol" },
    { voter_id: "erin", voted_for_id: "alice" },
  ];

  const accusation = determineAccused(votes);
  check("determineAccused flags the tie", accusation.isTie === true);
  check(
    "tied candidates are exactly the two front-runners",
    deepEqual(new Set(accusation.topVotedUserIds), new Set(["bob", "carol"])),
  );

  const result = computeRoundResult(votes, offSignal);
  check("playersWon is false on a tie", result.playersWon === false);
  check(
    "off-signal player evades with +2 and is the only one scoring",
    deepEqual(result.scoreDeltas, [{ user_id: offSignal, delta: 2 }]),
  );
}

// ---------------------------------------------------------------------------
// Scenario 3: clean majority, but they accuse the wrong (non-off-signal)
// player -> off-signal still evades.
// ---------------------------------------------------------------------------
function scenarioWrongAccusationEvades(): void {
  section("Scenario 3: confident but wrong accusation -> off-signal evades");

  const offSignal = "dave";
  const votes: Vote[] = [
    { voter_id: "alice", voted_for_id: "bob" },
    { voter_id: "carol", voted_for_id: "bob" },
    { voter_id: "erin", voted_for_id: "bob" },
    { voter_id: "dave", voted_for_id: "alice" },
  ];

  const result = computeRoundResult(votes, offSignal);
  check(
    "accusation lands on 'bob', not the actual off-signal player",
    result.accusation.topVotedUserIds[0] === "bob" && !result.accusation.isTie,
  );
  check("playersWon is false despite a unanimous non-tied accusation", result.playersWon === false);
  check(
    "off-signal player still evades with +2",
    deepEqual(result.scoreDeltas, [{ user_id: offSignal, delta: 2 }]),
  );
}

// ---------------------------------------------------------------------------
// Scenario 4: multi-round cumulative scoring across two rounds, applied
// on top of each other via applyScoreDeltas (as B2/B3 will do turn-by-turn).
// ---------------------------------------------------------------------------
function scenarioCumulativeScoring(): void {
  section("Scenario 4: cumulative scoring across two rounds");

  let scores: Record<string, number> = { alice: 0, bob: 0, carol: 0, dave: 0 };

  // Round 1: carol is off-signal, caught cleanly by alice + bob.
  const round1Votes: Vote[] = [
    { voter_id: "alice", voted_for_id: "carol" },
    { voter_id: "bob", voted_for_id: "carol" },
    { voter_id: "dave", voted_for_id: "alice" },
  ];
  const round1 = computeRoundResult(round1Votes, "carol");
  scores = applyScoreDeltas(scores, round1.scoreDeltas);
  check(
    "after round 1, alice and bob are up 1 each, carol/dave untouched",
    scores.alice === 1 && scores.bob === 1 && scores.carol === 0 && scores.dave === 0,
  );

  // Round 2: dave is off-signal, evades on a tie.
  const round2Votes: Vote[] = [
    { voter_id: "alice", voted_for_id: "bob" },
    { voter_id: "bob", voted_for_id: "carol" },
    { voter_id: "carol", voted_for_id: "bob" },
  ];
  const round2 = computeRoundResult(round2Votes, "dave");
  scores = applyScoreDeltas(scores, round2.scoreDeltas);
  check(
    "after round 2, dave picks up +2 from evading, others unchanged from round 1",
    scores.alice === 1 && scores.bob === 1 && scores.carol === 0 && scores.dave === 2,
  );
}

// ---------------------------------------------------------------------------
// Scenario 5: defensive guards fire correctly below the 3-player minimum,
// and advanceSpeaker rejects an out-of-bounds index. These are the "throws"
// noted as intentional in wordAssignment.ts / turnOrder.ts comments.
// ---------------------------------------------------------------------------
function scenarioDefensiveGuards(): void {
  section("Scenario 5: defensive guards (below-minimum players, bad state)");

  const rng = makeSeededRandomSource(7);

  let threw = false;
  try {
    pickOffSignalPlayer(["alice", "bob"], rng);
  } catch {
    threw = true;
  }
  check("pickOffSignalPlayer throws below 3 players", threw);

  threw = false;
  try {
    generateSpeakingOrder(["alice", "bob"], rng);
  } catch {
    threw = true;
  }
  check("generateSpeakingOrder throws below 3 players", threw);

  threw = false;
  try {
    advanceSpeaker({ speakingOrder: ["alice", "bob", "carol"], currentSpeakerIndex: 5 });
  } catch {
    threw = true;
  }
  check("advanceSpeaker throws on an out-of-bounds index", threw);

  check(
    "determineAccused on zero votes returns no top-voted players, no tie",
    deepEqual(determineAccused([]), { topVotedUserIds: [], isTie: false, voteCounts: {} }),
  );
}

// ---------------------------------------------------------------------------
// Scenario 6: shuffle / pickWordPair determinism sanity check — same seed
// in, same sequence out. Guards against someone accidentally swapping in
// Math.random as a default somewhere and silently breaking reproducibility.
// ---------------------------------------------------------------------------
function scenarioDeterminism(): void {
  section("Scenario 6: same seed -> identical output (reproducibility)");

  const rngA = makeSeededRandomSource(123);
  const rngB = makeSeededRandomSource(123);

  const pairA = pickWordPair(WORD_BANK, rngA);
  const pairB = pickWordPair(WORD_BANK, rngB);
  check("pickWordPair is deterministic under a fixed seed", deepEqual(pairA, pairB));

  const shuffledA = shuffle(["alice", "bob", "carol", "dave", "erin"], rngA);
  const shuffledB = shuffle(["alice", "bob", "carol", "dave", "erin"], rngB);
  check("shuffle is deterministic under a fixed seed", deepEqual(shuffledA, shuffledB));

  const rngDifferentSeed = makeSeededRandomSource(999);
  const shuffledC = shuffle(["alice", "bob", "carol", "dave", "erin"], rngDifferentSeed);
  check(
    "a different seed produces a different shuffle (sanity check, not a hard guarantee)",
    !deepEqual(shuffledA, shuffledC),
  );

  // tallyVotes sanity, used implicitly above but worth a direct check too.
  const tally = tallyVotes([
    { voter_id: "a", voted_for_id: "x" },
    { voter_id: "b", voted_for_id: "x" },
    { voter_id: "c", voted_for_id: "y" },
  ]);
  check("tallyVotes counts correctly", deepEqual(tally, { x: 2, y: 1 }));
}

// ---------------------------------------------------------------------------
// Run everything.
// ---------------------------------------------------------------------------
console.log("A5 test harness — A2 (word assignment) + A3 (turn order) + A4 (voting)\n" + "=".repeat(72));

scenarioHappyPath();
scenarioTieEvades();
scenarioWrongAccusationEvades();
scenarioCumulativeScoring();
scenarioDefensiveGuards();
scenarioDeterminism();

console.log("\n" + "=".repeat(72));
console.log(`${passCount} passed, ${failCount} failed`);

if (failCount > 0) {
  process.exit(1);
}
