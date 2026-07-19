/**
 * Pure logic for speaking-order generation and turn advancement within a
 * round. No Convex imports here on purpose — same testability constraint as
 * wordAssignment.ts (see A5 for the shared test harness).
 */

import type { RandomSource } from "./wordAssignment";
import { defaultRandomSource } from "./wordAssignment";

/** Default time each player gets to speak before the server auto-advances. */
export const DEFAULT_TURN_DURATION_MS = 30_000;

/**
 * Fisher-Yates shuffle using an injected RNG, so tests can use a seeded/fake
 * source instead of Math.random. Does not mutate the input array.
 */
export function shuffle<T>(
  items: T[],
  rng: RandomSource = defaultRandomSource,
): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates a randomized speaking order for a round. Separate from the
 * player roster so callers can pass a filtered "still connected" list if
 * needed later (Phase F hardening) without changing this function's shape.
 */
export function generateSpeakingOrder(
  playerIds: string[],
  rng: RandomSource = defaultRandomSource,
): string[] {
  if (playerIds.length < 3) {
    throw new Error(
      `generateSpeakingOrder: need at least 3 players, got ${playerIds.length}`,
    );
  }
  return shuffle(playerIds, rng);
}

export interface TurnState {
  speakingOrder: string[];
  currentSpeakerIndex: number;
}

export interface TurnAdvanceResult {
  /** Index to move to. Equal to input index's speakingOrder.length if done. */
  nextSpeakerIndex: number;
  /** True once every player in speakingOrder has had a turn. */
  isSpeakingComplete: boolean;
  /** Convenience: the user_id whose turn it now is, or null if complete. */
  nextSpeakerUserId: string | null;
}

/**
 * Advances from the current speaker to the next one. Does not itself decide
 * *when* to advance (that's a timer or an explicit "done speaking" action
 * wired in at the Convex mutation layer, B2) — this is just "given we're
 * advancing, what's the new state."
 */
export function advanceSpeaker(state: TurnState): TurnAdvanceResult {
  const { speakingOrder, currentSpeakerIndex } = state;

  if (currentSpeakerIndex < -1 || currentSpeakerIndex >= speakingOrder.length) {
    throw new Error(
      `advanceSpeaker: currentSpeakerIndex ${currentSpeakerIndex} out of ` +
        `bounds for speakingOrder of length ${speakingOrder.length}`,
    );
  }

  const nextSpeakerIndex = currentSpeakerIndex + 1;
  const isSpeakingComplete = nextSpeakerIndex >= speakingOrder.length;

  return {
    nextSpeakerIndex,
    isSpeakingComplete,
    nextSpeakerUserId: isSpeakingComplete
      ? null
      : speakingOrder[nextSpeakerIndex],
  };
}

/** Computes the server-authoritative deadline for the current turn. */
export function computeTurnExpiry(
  now: number,
  durationMs: number = DEFAULT_TURN_DURATION_MS,
): number {
  return now + durationMs;
}

/** True once `now` has passed the stored turn deadline. */
export function hasTurnExpired(now: number, turnExpiresAt: number): boolean {
  return now >= turnExpiresAt;
}
