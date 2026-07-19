/**
 * Pure logic for word-pair selection and off-signal player assignment.
 * No Convex imports here on purpose — this file should be usable in a plain
 * Node/ts-node test harness (see A5) with zero database setup.
 */

export interface WordPair {
  main: string;
  offSignal: string;
}

/**
 * Word bank: each pair is a "main" word everyone but the off-signal player
 * gets, and a closely related "offSignal" word the odd-one-out gets instead.
 * The words should be close enough that the off-signal player's description
 * plausibly overlaps with the main word, but distinct enough that careful
 * listening can reveal the mismatch. This is a starter bank — expand freely,
 * it's just data.
 */
export const WORD_BANK: WordPair[] = [
  { main: "Coffee", offSignal: "Tea" },
  { main: "Beach", offSignal: "Lake" },
  { main: "Guitar", offSignal: "Violin" },
  { main: "Pizza", offSignal: "Flatbread" },
  { main: "Winter", offSignal: "Autumn" },
  { main: "Doctor", offSignal: "Nurse" },
  { main: "Airplane", offSignal: "Helicopter" },
  { main: "Novel", offSignal: "Memoir" },
  { main: "Soccer", offSignal: "Rugby" },
  { main: "Volcano", offSignal: "Geyser" },
  { main: "Chess", offSignal: "Checkers" },
  { main: "Sushi", offSignal: "Sashimi" },
  { main: "Desert", offSignal: "Savanna" },
  { main: "Painter", offSignal: "Sculptor" },
  { main: "Subway", offSignal: "Bus" },
];

export interface RandomSource {
  /** Returns a float in [0, 1), like Math.random(). Injected for testability. */
  next: () => number;
}

export const defaultRandomSource: RandomSource = { next: Math.random };

function pickRandomIndex(length: number, rng: RandomSource): number {
  if (length <= 0) {
    throw new Error("pickRandomIndex: length must be > 0");
  }
  return Math.floor(rng.next() * length);
}

/** Picks a random word pair from a bank (defaults to WORD_BANK). */
export function pickWordPair(
  bank: WordPair[] = WORD_BANK,
  rng: RandomSource = defaultRandomSource,
): WordPair {
  if (bank.length === 0) {
    throw new Error("pickWordPair: word bank is empty");
  }
  return bank[pickRandomIndex(bank.length, rng)];
}

/** Picks one off-signal player uniformly at random from the roster. */
export function pickOffSignalPlayer(
  playerIds: string[],
  rng: RandomSource = defaultRandomSource,
): string {
  if (playerIds.length < 3) {
    // Below 3 players the social-deduction premise breaks down (too easy to
    // deduce or nothing to deduce). Callers should enforce a minimum before
    // reaching this point; this is a defensive guard, not the UX-facing check.
    throw new Error(
      `pickOffSignalPlayer: need at least 3 players, got ${playerIds.length}`,
    );
  }
  return playerIds[pickRandomIndex(playerIds.length, rng)];
}

export interface RoundAssignment {
  wordMain: string;
  wordOffSignal: string;
  offSignalUserId: string;
  /** Convenience map every consumer will want: user_id -> word they see. */
  wordByUserId: Record<string, string>;
}

/**
 * Full assignment for one round: pick a word pair, pick the off-signal
 * player, and produce the per-player word map the client will render from.
 */
export function assignRound(
  playerIds: string[],
  bank: WordPair[] = WORD_BANK,
  rng: RandomSource = defaultRandomSource,
): RoundAssignment {
  const pair = pickWordPair(bank, rng);
  const offSignalUserId = pickOffSignalPlayer(playerIds, rng);

  const wordByUserId: Record<string, string> = {};
  for (const id of playerIds) {
    wordByUserId[id] = id === offSignalUserId ? pair.offSignal : pair.main;
  }

  return {
    wordMain: pair.main,
    wordOffSignal: pair.offSignal,
    offSignalUserId,
    wordByUserId,
  };
}
