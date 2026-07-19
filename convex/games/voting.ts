/**
 * Pure logic for tallying votes and computing a round's reveal result,
 * including scoring. No Convex imports here on purpose — same testability
 * constraint as wordAssignment.ts / turnOrder.ts.
 *
 * DEFAULT SCORING RULE (a design decision, not from the PRD — flag for
 * product review, easy to retune since it's isolated in one function):
 *   - If there is a single top-voted player (no tie) AND that player is the
 *     off-signal player: the "players" win. Every voter who voted correctly
 *     gets +1 point. The off-signal player gets 0.
 *   - Otherwise (a tie at the top, or the accused wasn't the off-signal
 *     player): the off-signal player "evaded" and gets +2 points. No one
 *     else scores.
 */

export interface Vote {
  voter_id: string;
  voted_for_id: string;
}

/** Counts votes per candidate. Candidates with 0 votes are simply absent. */
export function tallyVotes(votes: Vote[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const vote of votes) {
    counts[vote.voted_for_id] = (counts[vote.voted_for_id] ?? 0) + 1;
  }
  return counts;
}

export interface AccusationResult {
  /** All player(s) tied for the most votes. Length 1 unless there's a tie. */
  topVotedUserIds: string[];
  isTie: boolean;
  voteCounts: Record<string, number>;
}

/** Determines who was voted for the most, and whether it was a tie. */
export function determineAccused(votes: Vote[]): AccusationResult {
  const voteCounts = tallyVotes(votes);
  const entries = Object.entries(voteCounts);

  if (entries.length === 0) {
    return { topVotedUserIds: [], isTie: false, voteCounts };
  }

  const maxVotes = Math.max(...entries.map(([, count]) => count));
  const topVotedUserIds = entries
    .filter(([, count]) => count === maxVotes)
    .map(([userId]) => userId);

  return {
    topVotedUserIds,
    isTie: topVotedUserIds.length > 1,
    voteCounts,
  };
}

export interface ScoreDelta {
  user_id: string;
  delta: number;
}

export interface RoundResult {
  accusation: AccusationResult;
  offSignalUserId: string;
  /** True only when there's a single accused player and it's the off-signal player. */
  playersWon: boolean;
  scoreDeltas: ScoreDelta[];
}

/**
 * Computes the full reveal result for a round: who was accused, whether the
 * off-signal player was correctly caught, and the resulting score deltas.
 * Pass the current votes and the round's known off-signal player id.
 */
export function computeRoundResult(
  votes: Vote[],
  offSignalUserId: string,
): RoundResult {
  const accusation = determineAccused(votes);

  const playersWon =
    !accusation.isTie &&
    accusation.topVotedUserIds.length === 1 &&
    accusation.topVotedUserIds[0] === offSignalUserId;

  const scoreDeltas: ScoreDelta[] = [];

  if (playersWon) {
    for (const vote of votes) {
      if (vote.voted_for_id === offSignalUserId) {
        scoreDeltas.push({ user_id: vote.voter_id, delta: 1 });
      }
    }
  } else {
    scoreDeltas.push({ user_id: offSignalUserId, delta: 2 });
  }

  return {
    accusation,
    offSignalUserId,
    playersWon,
    scoreDeltas,
  };
}

/**
 * Applies a set of score deltas to existing per-player scores, returning a
 * new map (does not mutate input). Players with no delta keep their score
 * unchanged. Useful both for the Convex mutation layer and for tests that
 * want to check cumulative scores across several rounds.
 */
export function applyScoreDeltas(
  currentScores: Record<string, number>,
  deltas: ScoreDelta[],
): Record<string, number> {
  const next = { ...currentScores };
  for (const { user_id, delta } of deltas) {
    next[user_id] = (next[user_id] ?? 0) + delta;
  }
  return next;
}
