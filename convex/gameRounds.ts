import { mutation, query, internalMutation, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { assignRound } from "./games/wordAssignment";
import {
  advanceSpeaker as advanceSpeakerPure,
  computeTurnExpiry,
  DEFAULT_VOTING_DURATION_MS,
  generateSpeakingOrder,
  hasTurnExpired,
} from "./games/turnOrder";
import { applyScoreDeltas, computeRoundResult, tallyVotes } from "./games/voting";
import { AUTOSTART_COUNTDOWN_MS, WINNING_SCORE } from "./games/lobbyConfig";
import { logGameEvent } from "./gameEvents";

/**
 * Round lifecycle for Anomaly game sessions — B2 (startRound / advanceSpeaker)
 * + B3 (castVote / revealRound) + B4 (speaking-turn auto-advance timer) +
 * B5 (getRoundView subscription query), wired to the A2/A3/A4 pure engine.
 * All of it lives together on purpose, same reasoning as calls.ts holding
 * every call-lifecycle mutation in one place rather than splitting per verb.
 *
 * SCOPE: like B1's gameSessions.ts, these mutations are mode-agnostic —
 * nothing here assumes `mode === "private"`. Round mechanics don't care
 * which kind of session they're running in, so Phase E's public-lobby UI
 * should be able to call straight into these without modification.
 *
 * DESIGN DECISION (flagged as open at the end of B2, resolved at B3): the
 * off-signal player DOES vote, same as everyone else — they're just voting
 * on a word they can't actually name, and can't vote for themselves (see
 * castVote below). Their vote can never earn them points (computeRoundResult
 * only scores voters who correctly named the off-signal player, and the
 * off-signal player obviously won't do that), but forcing them to sit out
 * would itself be a tell, so full participation is the least revealing
 * default. `speaking_order` — which everyone is in, off-signal player
 * included — is used as the fixed "who must vote" roster for auto-reveal
 * below, precisely because it's locked in at round start and unaffected by
 * anyone connecting/disconnecting mid-round.
 *
 * TIMER DESIGN (B4) — deliberately NOT a literal copy of presence.ts's
 * `presenceCleanupScheduler` pattern, even though that's the pattern named
 * in the PRD/progress notes as precedent. That pattern fits a single global
 * poller (one presence-cleanup job, cancelled and rescheduled on every
 * heartbeat) tracked via one singleton row in its own table. Turn timers are
 * the opposite shape: many rounds can be mid-speaking-turn concurrently,
 * each needing its own independent deadline, so a single global job doesn't
 * fit and per-round job tracking would need a new schema field (a
 * `turn_timer_job_id` on `gameRounds`) just to support cancellation.
 * Instead, each scheduled `autoAdvanceOnExpiry` call carries the
 * `turn_expires_at` timestamp it was scheduled for. When it fires, it
 * re-reads the round and only acts if that timestamp still matches the
 * round's *current* `turn_expires_at` — if a manual `advanceSpeaker` call
 * already moved things along (or the round already left `"speaking"`), the
 * timestamps won't match and the job just no-ops. Trade-off accepted
 * knowingly: a manually-advanced turn leaves one harmless stale job sitting
 * in Convex's scheduler queue until its original fire time, in exchange for
 * not touching the A1 schema. Worth revisiting if that scheduler-queue
 * churn ever actually matters at scale.
 *
 * VOTING-PHASE TIMER (F1g): closes the gap this section used to flag —
 * previously nothing unstuck a round where speaking finished but a
 * connected player just never voted (the F1d auto-reveal only fires once
 * every *connected required* voter has cast a vote; a connected player who
 * simply sits on it forever isn't caught by that). `applyAdvance` now
 * stamps `voting_expires_at` (`DEFAULT_VOTING_DURATION_MS` — 60s — out from
 * the moment speaking ends) the same way it already stamps
 * `turn_expires_at` for a speaking turn, and schedules a self-validating
 * `autoRevealOnVotingExpiry` job via `scheduleAutoReveal`, mirroring B4's
 * `autoAdvanceOnExpiry`/`scheduleAutoAdvance` pair exactly: the job carries
 * the deadline it was scheduled for, and on firing it re-reads the round
 * and only acts if it's still `"voting"` with a matching
 * `voting_expires_at` — a manual `revealRound` call, or `castVote`'s own
 * auto-reveal, already moving the round to `"revealed"` makes it a no-op.
 * When it does fire, it calls `performReveal` with whatever votes exist at
 * that moment — `computeRoundResult` (A4) already handles a partial or
 * even empty vote list cleanly (no majority winner defaults to "off-signal
 * evaded"), so no new scoring case was needed, only the trigger.
 *
 * SECURITY NOTE — REDACTION (B5): `gameRounds` rows store `word_offsignal`
 * and `offsignal_user_id` directly on the row, per the A1 schema. A raw
 * subscription to a round row would leak who's off-signal (and both words)
 * to every player, not just the off-signal player themself. `getRoundView`
 * below is the only client-facing read of round state and is where that
 * redaction actually happens: each viewer gets their own word only
 * (`myWord`, resolved server-side from their identity), and
 * `offsignal_user_id` / the other word never leave the server until
 * `status === "revealed"`, at which point the full `computeRoundResult`
 * (A4) is recomputed fresh from the stored `votes` rather than trusted from
 * any cached copy — nothing persists the reveal outcome as extra fields.
 *
 * SYSTEM MESSAGES (C6): three round events post into the room's existing
 * `messages` table via `postSystemMessage` below, reusing the same
 * `type: "system"` shape `rooms.ts` already uses for join/leave — round
 * started (`startRound`), voting opened (`applyAdvance`, the shared
 * transition point for both manual `advanceSpeaker` and the scheduled
 * `autoAdvanceOnExpiry` job — see TIMER DESIGN above for why those two
 * share one function), and round result (`performReveal`, shared by
 * `castVote`'s auto-trigger and the explicit `revealRound` mutation, so
 * exactly one result message posts however the reveal was triggered).
 *
 * INTERPRETATION CALL — the PRD's three example events are "round started,
 * someone voted, round result." Read literally, "someone voted" would mean
 * one system message per `castVote` call. Not done: `castVote` is an
 * upsert (changing your vote re-fires it) and a public 10-player room could
 * see a dozen-plus casts in a single voting phase, which would flood the
 * room's chat with noise far past "lightweight." Implemented instead as a
 * single "voting is open" message at the moment speaking ends and voting
 * begins — same spirit (marks that voting is happening) without the spam.
 * Worth a product look if per-vote-cast messages were actually intended.
 *
 * Round-started messages deliberately do NOT name who triggered them or
 * reveal anything about the word assignment (still fully redacted at this
 * point) — same redaction posture as `getRoundView`. Round-result messages
 * DO name the off-signal player and both words, since by then the round is
 * `"revealed"` and that information is no longer secret to anyone.
 *
 * All three use a synthetic `ANOMALY_SYSTEM_SENDER` rather than attributing
 * the message to whichever player's action happened to trigger it (or, for
 * `autoAdvanceOnExpiry`, to no one — that job runs with no authenticated
 * identity at all, so there is no player to attribute it to even if we
 * wanted to). A consistent "Anomaly" byline reads better than messages that
 * sometimes carry a player's name and sometimes don't depending on which
 * code path fired. Both are exported (not just used locally) so C7's
 * `endSession` (in gameSessions.ts) can post its own "Anomaly ended" message
 * through the exact same helper instead of a second copy of the same
 * `messages` insert shape.
 *
 * LOCK-ON-START (D2b): `startRound`'s status transition out of "waiting" is
 * mode-dependent — public sessions go straight to "locked" (starting a
 * round is itself one of the two conditions schema.ts's own comment gives
 * for that literal: "full or started, not accepting joiners"), private
 * sessions keep going to "in_progress" since their real join gate is
 * `joinSession`'s room-membership check, not this field. See the comment
 * directly above the `ctx.db.patch` call in `startRound` for the full
 * reasoning. This is the second (and, per current schema, last) place a
 * session's status can reach `"locked"` — the first is D2a's lock-on-full
 * in `gameSessions.ts`'s `seatPlayerInSession`.
 *
 * ENDED-SESSION GUARDS (C7): `startRound` already refused to act on an
 * `"ended"` session (B2). `advanceSpeaker`, `castVote`, `revealRound`, and
 * the scheduled `autoAdvanceOnExpiry` job now all check the same thing —
 * added alongside `gameSessions.endSession` so that ending a session (from
 * any client, mid-round or not) actually stops the round in its tracks
 * instead of leaving a stale scheduled job or a stray vote quietly still
 * mutating a round nobody's watching anymore.
 *
 * DISCONNECT-AWARE ROUND FLOW (F1c + F1d): both land here together since
 * they're really one question — "what should a disconnected player's turn
 * or vote requirement do to round flow" — answered two different ways
 * depending on phase:
 *
 * - F1c (speaking phase): a disconnected CURRENT SPEAKER has their turn
 *   ended immediately rather than sitting through the full
 *   `DEFAULT_TURN_DURATION_MS`. EXPLICIT DECISION (flagged as open since
 *   F1a/F1b): "immediately" means on gamePresence.ts's next staleness-sweep
 *   tick (`markStaleDisconnected`, ~`STALE_THRESHOLD_MS` = 25s worst case)
 *   or the instant a clean-close `goOffline` lands — NOT "only when the
 *   30s turn timer itself fires," which would mean a disconnected speaker
 *   still burns their full turn regardless. Chosen because
 *   `gamePresence.ts`'s own file header already establishes "a 30s turn
 *   timer is the relevant unit of time" as the reason its heartbeat/stale
 *   cadence is far tighter than global presence — that reasoning only pays
 *   off if a caught disconnect actually acts on the round, not just the
 *   `connected` flag. `handlePlayerDisconnected` below is what
 *   `gamePresence.ts` calls (as a plain function, not a second mutation —
 *   Convex mutations can't invoke each other directly, same constraint
 *   D1's `seatPlayerInSession` extraction hit) from both `goOffline` and
 *   `markStaleDisconnected` once a player's `connected` flips to `false`.
 *
 * - F1d (voting phase): `castVote`'s auto-reveal used to require a vote
 *   from every id in `round.speaking_order` literally — a disconnected
 *   voter who will never cast a vote could stall a round in `"voting"`
 *   forever, since nothing ever re-checks once the last *connected* voter
 *   has already voted. Resolved by requiring a vote only from CONNECTED
 *   players in `speaking_order` (`getConnectedRequiredVoters` below) —
 *   already-cast votes from a since-disconnected player still count in the
 *   tally, they just stop being required for the reveal to trigger. Two
 *   call sites now need this same re-check: `castVote` itself (unchanged
 *   trigger point — a connected player casting the last *required* vote),
 *   and `handlePlayerDisconnected`'s voting-phase branch (a player going
 *   stale/offline can itself be the thing that drops the "still need N
 *   more votes" count to zero, with no further `castVote` call left to
 *   notice). Deliberately narrow: this closes the specific "disconnected
 *   voter stalls the round" gap flagged repeatedly since B2/B3, not the
 *   more general "a round with only connected players who simply never
 *   vote" case — that would need an actual voting-phase timer (a new
 *   schema field + scheduled job, mirroring B4's speaking-phase one), which
 *   is real net-new scope beyond what F1d's plan line asked for. If every
 *   required voter happens to be disconnected at once, `every()` over an
 *   empty required-voters list is vacuously true and reveal fires with
 *   whatever votes exist (including zero) — the same "handles zero votes
 *   cleanly" behavior A5's harness already covers for `determineAccused`,
 *   not a new edge case invented here.
 *
 * NOT covered by F1c/F1d (left for F1e/F1f): no UI anywhere yet reflects a
 * `connected: false` player differently from a connected one — that's
 * F1e's explicit job, not silently assumed done here.
 */

/**
 * Every Anomaly round-event system message shares this byline rather than
 * attributing to whichever player's action triggered it — see the file
 * header's SYSTEM MESSAGES note for why. `sender_id` is a fixed sentinel,
 * not a real `users` row; the messages read path (`messages.ts`) builds
 * its `sender` object straight from the stored `sender_username` /
 * `sender_avatar` fields rather than re-joining against `users`, so this
 * needs no matching user record to render correctly.
 */
export const ANOMALY_SYSTEM_SENDER = { sender_id: "anomaly_system", sender_username: "Anomaly" };

/**
 * Posts one system message into the room this session is scoped to,
 * reusing the exact `messages` shape `rooms.ts` already uses for its own
 * join/leave system messages. `session.room_id` is used as-is regardless
 * of session mode (see file header's mode-agnostic SCOPE note) — private
 * sessions point at a real Orbital room, and Phase E's public-lobby rooms
 * are expected to reuse the same room/chat surface once built.
 */
export async function postSystemMessage(ctx: MutationCtx, session: Doc<"gameSessions">, content: string) {
  await ctx.db.insert("messages", {
    conversation_id: session.room_id,
    conversation_type: "room",
    sender_id: ANOMALY_SYSTEM_SENDER.sender_id,
    sender_username: ANOMALY_SYSTEM_SENDER.sender_username,
    sender_avatar: undefined,
    content,
    type: "system",
    file_url: null,
    file_name: null,
  });
}

// Typed to QueryCtx (not MutationCtx) deliberately — both helpers are
// read-only, and QueryCtx is the narrower/common interface, so every
// existing mutation call site above still works (a MutationCtx's db is a
// strict superset of QueryCtx's) while B5's new query below can call them
// too without needing a duplicate read-only copy of the same lookups.
async function getGamePlayer(ctx: QueryCtx, session_id: string, user_id: string) {
  return await ctx.db
    .query("gamePlayers")
    .withIndex("by_user_session", (q) =>
      q.eq("user_id", user_id).eq("session_id", session_id),
    )
    .first();
}

async function findRound(ctx: QueryCtx, session_id: string, round_number: number) {
  const rounds = await ctx.db
    .query("gameRounds")
    .withIndex("by_session_id", (q) => q.eq("session_id", session_id))
    .collect();
  return rounds.find((r) => r.round_number === round_number) ?? null;
}

/**
 * F1d: the actual "who must vote for auto-reveal to trigger" roster —
 * `speaking_order` filtered down to players who are still `connected`
 * (missing/undefined `connected` counts as connected, same `!== false`
 * convention every other connected-check in this codebase already uses).
 * A player whose `gamePlayers` row is missing entirely (shouldn't happen —
 * `speaking_order` is only ever populated from real seated players at round
 * start — but handled defensively rather than assumed) is excluded, not
 * required, since there's no row to ever flip back to voted either way.
 * Exported so `getRoundView` can surface the same denominator the backend
 * actually uses, rather than the UI recomputing (and potentially drifting
 * from) this logic client-side.
 */
export async function getConnectedRequiredVoters(
  ctx: QueryCtx,
  session_id: string,
  speakingOrder: string[],
): Promise<string[]> {
  const players = await Promise.all(
    speakingOrder.map((userId) => getGamePlayer(ctx, session_id, userId)),
  );
  return speakingOrder.filter((_, i) => players[i] !== null && players[i]!.connected !== false);
}

/**
 * Schedules the self-validating auto-advance job described in the file
 * header's TIMER DESIGN note. `turnExpiresAt` doubles as both the deadline
 * and the staleness token the job checks against when it fires.
 */
async function scheduleAutoAdvance(ctx: MutationCtx, round_id: Id<"gameRounds">, turnExpiresAt: number) {
  await ctx.scheduler.runAt(turnExpiresAt, internal.gameRounds.autoAdvanceOnExpiry, {
    round_id,
    expected_turn_expires_at: turnExpiresAt,
  });
}

/**
 * F1g — voting-phase counterpart to `scheduleAutoAdvance` above. Same
 * self-validating-token pattern: `votingExpiresAt` is both the deadline and
 * the staleness check `autoRevealOnVotingExpiry` compares against when it
 * fires, so a reveal that already happened by other means (last required
 * vote landing, a manual `revealRound`) just makes this a harmless no-op
 * rather than needing an explicit cancel.
 */
async function scheduleAutoReveal(ctx: MutationCtx, round_id: Id<"gameRounds">, votingExpiresAt: number) {
  await ctx.scheduler.runAt(votingExpiresAt, internal.gameRounds.autoRevealOnVotingExpiry, {
    round_id,
    expected_voting_expires_at: votingExpiresAt,
  });
}

/**
 * The actual "put a round on the board" logic, extracted out of `startRound`
 * (E2) so a second caller — the autostart-countdown job below — can trigger
 * it too without an authenticated identity to check. Same reasoning as
 * `gameSessions.ts`'s `seatPlayerInSession` extraction: mutations can't call
 * other mutations directly in Convex, and `startRound`'s own identity/
 * membership checks are meaningless for a system-triggered start anyway (see
 * `autoStartRound` below), so those checks stay in the two call sites and
 * everything after them lives here once.
 *
 * G1: `trigger` is caller-supplied ("manual" from `startRound`,
 * "autostart" from `autoStartRound`) purely so the `round_started` event
 * logged below can carry it in `metadata` — see gameEvents.ts's own note on
 * why `round_started` has no `user_id` for the autostart path (no
 * authenticated caller exists there) and needs some other way to
 * distinguish the two triggers downstream.
 */
async function beginRound(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  trigger: "manual" | "autostart",
  triggeredByUserId?: string,
) {
  // Idempotency guard: don't clobber an in-flight round if this gets
  // double-clicked or raced (e.g. two players both hit "start"), or if the
  // countdown's autostart job fires after a player already manually started
  // the round in the meantime.
  const existingRound = await findRound(ctx, session.session_id, session.current_round);
  if (existingRound && existingRound.status !== "revealed") {
    return { error: "A round is already in progress", round_number: existingRound.round_number };
  }

  const connectedPlayers = (
    await ctx.db
      .query("gamePlayers")
      .withIndex("by_session_id", (q) => q.eq("session_id", session.session_id))
      .collect()
  ).filter((p) => p.connected !== false);

  // UX-facing version of the same >=3 floor the pure engine enforces
  // defensively (pickOffSignalPlayer / generateSpeakingOrder) — catching
  // it here means the caller gets a clean {error} instead of a thrown
  // exception bubbling out of a mutation.
  if (connectedPlayers.length < 3) {
    return { error: `Need at least 3 connected players to start a round (have ${connectedPlayers.length})` };
  }

  const playerIds = connectedPlayers.map((p) => p.user_id);

  // Imposter pick is a plain, uniform-random draw from every connected
  // player each round — no weighting toward players who've been imposter
  // less often. `assignRound` with no 4th arg falls through to
  // `pickOffSignalPlayer`'s pure-random pick internally.
  // `gamePlayers.offsignal_count` is still tracked below purely as an
  // informational per-player stat (surfaced on the leaderboard, H3) — it
  // has no bearing on who gets picked.
  const assignment = assignRound(playerIds);
  const speakingOrder = generateSpeakingOrder(playerIds);

  // Rounds always begin already "on" the first speaker — advance once
  // from the pre-round index (-1) rather than persisting a "nobody's
  // turn yet" intermediate state.
  const firstTurn = advanceSpeakerPure({ speakingOrder, currentSpeakerIndex: -1 });

  const now = Date.now();
  const round_number = session.current_round + 1;
  const turnExpiresAt = computeTurnExpiry(now);

  const roundId = await ctx.db.insert("gameRounds", {
    session_id: session.session_id,
    round_number,
    word_main: assignment.wordMain,
    word_offsignal: assignment.wordOffSignal,
    offsignal_user_id: assignment.offSignalUserId,
    speaking_order: speakingOrder,
    current_speaker_index: firstTurn.nextSpeakerIndex,
    turn_expires_at: turnExpiresAt,
    votes: [],
    status: "speaking",
  });
  await scheduleAutoAdvance(ctx, roundId, turnExpiresAt);

  // Record that this player was just dealt the off-signal role. Purely a
  // per-player stat now (surfaced on the leaderboard, H3) — imposter
  // selection above is a uniform random draw and never reads this value.
  const offSignalPlayerDoc = connectedPlayers.find(
    (p) => p.user_id === assignment.offSignalUserId,
  );
  if (offSignalPlayerDoc) {
    await ctx.db.patch(offSignalPlayerDoc._id, {
      offsignal_count: (offSignalPlayerDoc.offsignal_count ?? 0) + 1,
    });
  }

  // LOCK-ON-START (D2b): what a "waiting" session promotes *to* here
  // depends on mode. Public sessions go straight to "locked" — per the
  // PRD ("once ... a host/timer starts the round, it's marked locked and
  // stops accepting new joiners") and schema.ts's own comment on the
  // literal ("locked" = "full or started, not accepting joiners"),
  // starting a round is itself one of the two conditions that define
  // "locked", not a separate "in_progress" state that still needs a
  // follow-up lock. Skipping straight there also means
  // `seatPlayerInSession`'s existing locked/ended gate (D2a, unchanged by
  // this session) is the only thing that ever has to check — a public
  // session that started via this branch is rejected by the exact same
  // condition as one that filled via D2a, with no second status value for
  // that gate (or Phase E's future UI) to also know about. A public
  // session that got here already "locked" (filled to capacity via D2a
  // before its round started, or promoted by E2's own autostart job below)
  // stays "locked" — the ternary's `session.status` fallback arm covers
  // that no-op case explicitly rather than by omission.
  //
  // Private sessions keep the pre-D2b "in_progress" behavior: a private
  // session's real join gate is `joinSession`'s room-membership check
  // (any current room member can join, mid-round or not — that's the
  // "no separate lobby, no re-invite step" premise of Feature 1), not
  // this status field, so there's nothing for a private session to lock
  // by starting a round. "locked" staying reserved for capacity/public-
  // matchmaking concerns keeps that field meaning one thing.
  //
  // Either branch only ever fires from "waiting" — a session that's
  // already "in_progress"/"locked" just stays there across subsequent
  // rounds (round 2+ on the same session never re-touches this).
  await ctx.db.patch(session._id, {
    current_round: round_number,
    status:
      session.status === "waiting"
        ? session.mode === "public"
          ? "locked"
          : "in_progress"
        : session.status,
    // A round is now on the board — whatever autostart countdown got this
    // session here (E2) has done its job, and a stale timestamp left in
    // place would misleadingly suggest one is still ticking down.
    countdown_started_at: undefined,
  });

  await postSystemMessage(
    ctx,
    session,
    `Round ${round_number} has started with ${connectedPlayers.length} players.`,
  );

  // G1 — feeds the PRD's "click to round start" latency metric (paired
  // downstream against this session's earlier `public_join_requested`
  // events) plus general round-cadence visibility for the repeat-join
  // signal. Fires for both modes/both triggers — see this function's own
  // doc comment above for why `trigger` (not `user_id`, which is absent
  // for the autostart path) is how a downstream query tells them apart.
  await logGameEvent(ctx, {
    event_type: "round_started",
    session: { session_id: session.session_id, room_id: session.room_id, mode: session.mode },
    user_id: triggeredByUserId,
    round_number,
    metadata: { trigger },
  });

  return { success: true, round_number, firstSpeakerUserId: firstTurn.nextSpeakerUserId };
}

export const startRound = mutation({
  args: { session_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
    if (!session) return { error: "Session not found" };
    if (session.status === "ended") return { error: "Session has ended" };

    const caller = await getGamePlayer(ctx, args.session_id, identity.subject);
    if (!caller) return { error: "Only players in this session can start a round" };

    return await beginRound(ctx, session, "manual", identity.subject);
  },
});

/**
 * AUTOSTART COUNTDOWN (E2) — the public lobby's "4 players triggers a 15s
 * countdown" default from orbital_1.md, which nothing before this session
 * actually implemented: A1 added the `min_players_to_start` /
 * `countdown_started_at` fields to `gameSessions`, D1 stamps the former on
 * every public session it creates, and D3's recycle path resets the latter
 * — but nothing ever *set* `countdown_started_at` on the way up or acted on
 * it once set. That's this section's job, plus the scheduled job that
 * actually calls `beginRound` when the countdown elapses.
 *
 * SCOPE: public-mode only, mirroring every other public-lobby-specific
 * piece of this schema (`min_players_to_start`, `countdown_started_at`
 * themselves). Private sessions have no autostart concept — Feature 1's
 * round-start action is `startRound` alone, always explicit.
 *
 * ELIGIBLE STATUSES: `"waiting"` *and* `"locked"`. A public session can be
 * `"locked"` without a round having started yet (D2a locks on hitting
 * `capacity`, which is a separate transition from actually starting a
 * round) — the countdown must still be able to fire in that case, since
 * "the room filled up" shouldn't strand a full lobby with no way to
 * autostart. `beginRound`'s own idempotency guard (an existing
 * non-`"revealed"` round) is what actually prevents a double-start, not the
 * status check here.
 *
 * STALE-TOKEN PATTERN: same shape as B4's turn timer
 * (`scheduleAutoAdvance`/`autoAdvanceOnExpiry`) — the scheduled job carries
 * the exact `countdown_started_at` timestamp it was scheduled for, and only
 * acts if the session's *current* value still matches when it fires. A
 * countdown that gets cancelled (player count drops back below the
 * threshold — `maybeCancelAutostartCountdown`) or restarted (recycled by
 * D3, or a fresh countdown after a cancel) invalidates any job already in
 * flight for the old timestamp, which then just no-ops instead of
 * incorrectly starting a round nobody currently expects.
 */
async function countConnectedPlayers(ctx: QueryCtx, session_id: string) {
  const players = await ctx.db
    .query("gamePlayers")
    .withIndex("by_session_id", (q) => q.eq("session_id", session_id))
    .collect();
  return players.filter((p) => p.connected !== false).length;
}

function isPreRoundPublicStatus(status: Doc<"gameSessions">["status"]) {
  return status === "waiting" || status === "locked";
}

/**
 * Called after seating a player into a public session (both branches of
 * `publicMatchmaking.ts`'s `findOrCreatePublicSession`). Starts the
 * countdown the moment connected player count first reaches
 * `min_players_to_start` — a no-op every other time (already running, not
 * public, not pre-round, or still under threshold).
 */
export async function maybeStartAutostartCountdown(ctx: MutationCtx, session: Doc<"gameSessions">) {
  if (session.mode !== "public") return;
  if (!isPreRoundPublicStatus(session.status)) return;
  if (session.countdown_started_at !== undefined) return; // already ticking
  if (session.min_players_to_start === undefined) return; // defensive — D1 always sets this for public sessions

  const connectedCount = await countConnectedPlayers(ctx, session.session_id);
  if (connectedCount < session.min_players_to_start) return;

  const startedAt = Date.now();
  await ctx.db.patch(session._id, { countdown_started_at: startedAt });
  await ctx.scheduler.runAfter(AUTOSTART_COUNTDOWN_MS, internal.gameRounds.autoStartRound, {
    session_id: session.session_id,
    expected_countdown_started_at: startedAt,
  });
}

/**
 * Called after a player leaves a public session (`gameSessions.ts`'s
 * `leaveSession`). If a countdown is running and the departure drops
 * connected count back below the threshold, clears it — a room that's no
 * longer at `min_players_to_start` shouldn't autostart just because it
 * briefly was. A later join is free to call `maybeStartAutostartCountdown`
 * again and get a fresh countdown; this function only ever cancels, never
 * restarts.
 */
export async function maybeCancelAutostartCountdown(ctx: MutationCtx, session: Doc<"gameSessions">) {
  if (session.mode !== "public") return;
  if (!isPreRoundPublicStatus(session.status)) return;
  if (session.countdown_started_at === undefined) return; // nothing running
  if (session.min_players_to_start === undefined) return;

  const connectedCount = await countConnectedPlayers(ctx, session.session_id);
  if (connectedCount >= session.min_players_to_start) return; // still enough — leave it running

  await ctx.db.patch(session._id, { countdown_started_at: undefined });
}

export const autoStartRound = internalMutation({
  args: { session_id: v.string(), expected_countdown_started_at: v.number() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
    if (!session) return;
    if (!isPreRoundPublicStatus(session.status)) return; // already started some other way, or ended
    if (session.countdown_started_at !== args.expected_countdown_started_at) return; // stale job

    const connectedCount = await countConnectedPlayers(ctx, session.session_id);
    if (session.min_players_to_start === undefined || connectedCount < session.min_players_to_start) {
      // Dropped below threshold since this job was scheduled without a
      // `leaveSession` call catching it in between (e.g. a disconnect path
      // that doesn't delete the gamePlayers row) — clear the stale
      // timestamp defensively. A future join still starts a fresh
      // countdown via `maybeStartAutostartCountdown`.
      await ctx.db.patch(session._id, { countdown_started_at: undefined });
      return;
    }

    await beginRound(ctx, session, "autostart");
  },
});

export const advanceSpeaker = mutation({
  args: { session_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
    if (!session) return { error: "Session not found" };
    if (session.status === "ended") return { error: "Session has ended" };

    const round = await findRound(ctx, args.session_id, session.current_round);
    if (!round || round.status !== "speaking") {
      return { error: "No active speaking round" };
    }

    const currentIndex = round.current_speaker_index ?? -1;
    const currentSpeakerId =
      currentIndex >= 0 && currentIndex < round.speaking_order.length
        ? round.speaking_order[currentIndex]
        : null;

    const now = Date.now();
    const turnExpired = round.turn_expires_at != null && hasTurnExpired(now, round.turn_expires_at);

    // Either it's genuinely your turn, or your turn's clock has already run
    // out and anyone can nudge it forward. B4's scheduled auto-advance
    // (autoAdvanceOnExpiry, below) is the "no one has to nudge it" path for
    // the same expiry case — this check just makes sure a manual nudge
    // isn't blocked from doing the same thing in the meantime.
    if (identity.subject !== currentSpeakerId && !turnExpired) {
      return { error: "Not your turn" };
    }

    const outcome = await applyAdvance(ctx, session, round);
    return { success: true, ...outcome };
  },
});

/**
 * The actual "move to the next speaker, or wrap up speaking" logic — shared
 * between the manual `advanceSpeaker` mutation above and the scheduled
 * `autoAdvanceOnExpiry` job below, so the two paths can't drift apart.
 * Callers are responsible for authorization; this just does the state
 * transition once it's already been decided the advance is allowed. Takes
 * `session` (rather than re-deriving it from `round.session_id` internally)
 * so both call sites — one of which already has it in scope, one of which
 * doesn't — fetch it exactly once each; needed here only for C6's
 * voting-opened system message.
 */
async function applyAdvance(ctx: MutationCtx, session: Doc<"gameSessions">, round: Doc<"gameRounds">) {
  const nextTurn = advanceSpeakerPure({
    speakingOrder: round.speaking_order,
    currentSpeakerIndex: round.current_speaker_index ?? -1,
  });

  if (nextTurn.isSpeakingComplete) {
    const votingExpiresAt = computeTurnExpiry(Date.now(), DEFAULT_VOTING_DURATION_MS);
    await ctx.db.patch(round._id, {
      status: "voting",
      current_speaker_index: nextTurn.nextSpeakerIndex,
      turn_expires_at: undefined,
      voting_expires_at: votingExpiresAt,
    });
    await scheduleAutoReveal(ctx, round._id, votingExpiresAt);
    await postSystemMessage(ctx, session, `Voting is open for round ${round.round_number}.`);
    return { phase: "voting" as const };
  }

  const newTurnExpiresAt = computeTurnExpiry(Date.now());
  await ctx.db.patch(round._id, {
    current_speaker_index: nextTurn.nextSpeakerIndex,
    turn_expires_at: newTurnExpiresAt,
  });
  await scheduleAutoAdvance(ctx, round._id, newTurnExpiresAt);

  return { phase: "speaking" as const, nextSpeakerUserId: nextTurn.nextSpeakerUserId };
}

/**
 * Fires at a speaking turn's deadline. Self-validating (see the file
 * header's TIMER DESIGN note) rather than relying on an explicit cancel: if
 * the round has since left `"speaking"`, or its `turn_expires_at` no longer
 * matches what this job was scheduled for (a manual advance already moved
 * things along), it's a stale invocation and no-ops.
 */
export const autoAdvanceOnExpiry = internalMutation({
  args: {
    round_id: v.id("gameRounds"),
    expected_turn_expires_at: v.number(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.round_id);
    if (!round) return;
    if (round.status !== "speaking") return;
    if (round.turn_expires_at !== args.expected_turn_expires_at) return;

    // No authenticated identity in a scheduled job (see file header's
    // SYSTEM MESSAGES note) — session is looked up fresh here rather than
    // carried through the scheduler payload, same reasoning A1/B4 already
    // apply to round_id: least state to keep in sync, one extra read is
    // cheap next to a scheduled function firing once per turn.
    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", round.session_id))
      .first();
    if (!session) return;
    if (session.status === "ended") return;

    await applyAdvance(ctx, session, round);
  },
});

/**
 * F1g — fires at a voting phase's deadline. Self-validating (see
 * `scheduleAutoReveal`'s doc comment above) exactly like
 * `autoAdvanceOnExpiry`: if the round has since left `"voting"`, or its
 * `voting_expires_at` no longer matches what this job was scheduled for
 * (the round was already revealed by the last required vote landing, or by
 * a manual `revealRound` call), it's a stale invocation and no-ops. When it
 * does apply, it force-reveals with whatever votes exist at that moment —
 * `performReveal`/`computeRoundResult` need no special-casing for a partial
 * vote list, so this is purely "call the same reveal path everything else
 * already uses, just from a third trigger."
 */
export const autoRevealOnVotingExpiry = internalMutation({
  args: {
    round_id: v.id("gameRounds"),
    expected_voting_expires_at: v.number(),
  },
  handler: async (ctx, args) => {
    const round = await ctx.db.get(args.round_id);
    if (!round) return;
    if (round.status !== "voting") return;
    if (round.voting_expires_at !== args.expected_voting_expires_at) return;

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", round.session_id))
      .first();
    if (!session) return;
    if (session.status === "ended") return;

    await performReveal(ctx, session, round);
  },
});

/**
 * Shared by the explicit `revealRound` mutation and castVote's auto-trigger
 * once every eligible voter has voted. Idempotent — safe to call on an
 * already-`"revealed"` round (returns `alreadyRevealed: true` and touches
 * nothing), since both call sites can plausibly race to be the one that
 * reveals.
 */
async function performReveal(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  round: Doc<"gameRounds">,
) {
  if (round.status === "revealed") {
    return { alreadyRevealed: true as const };
  }

  const result = computeRoundResult(round.votes, round.offsignal_user_id);

  // Only fetch/patch the specific players who actually have a score delta —
  // applyScoreDeltas (A4) leaves everyone else untouched by design, so
  // there's no need to round-trip the full roster through it.
  const affectedUserIds = result.scoreDeltas.map((d) => d.user_id);
  const affectedPlayers = await Promise.all(
    affectedUserIds.map((userId) => getGamePlayer(ctx, session.session_id, userId)),
  );

  const currentScores: Record<string, number> = {};
  affectedPlayers.forEach((player, i) => {
    if (player) currentScores[affectedUserIds[i]] = player.score;
  });
  const updatedScores = applyScoreDeltas(currentScores, result.scoreDeltas);

  await Promise.all(
    affectedPlayers.map((player, i) => {
      if (!player) return Promise.resolve();
      return ctx.db.patch(player._id, { score: updatedScores[affectedUserIds[i]] });
    }),
  );

  // Clearing voting_expires_at isn't required for correctness — the status
  // guard alone already makes any pending autoRevealOnVotingExpiry job a
  // no-op — but keeps a revealed round's row tidy rather than leaving a
  // now-meaningless timestamp sitting on it, same hygiene turn_expires_at
  // already gets on the speaking->voting transition.
  await ctx.db.patch(round._id, { status: "revealed", voting_expires_at: undefined });

  const offSignalPlayer = await getGamePlayer(ctx, session.session_id, round.offsignal_user_id);
  const offSignalName = offSignalPlayer?.username || "Someone";
  await postSystemMessage(
    ctx,
    session,
    result.playersWon
      ? `Round ${round.round_number} result: ${offSignalName} was off-signal and got caught! The word was "${round.word_main}" (off-signal: "${round.word_offsignal}").`
      : `Round ${round.round_number} result: ${offSignalName} was off-signal and evaded! The word was "${round.word_main}" (off-signal: "${round.word_offsignal}").`,
  );

  // H2 — score-threshold game end: the moment any player's cumulative
  // score reaches WINNING_SCORE, the session is over. Checked against the
  // *whole* roster (not just this reveal's affected players/currently-
  // connected players) since a score, once earned, counts toward the
  // threshold regardless of connection state — only `updatedScores` (this
  // reveal's fresh values) needs to override the stale `p.score` read for
  // whichever players this round actually touched.
  const allPlayers = await ctx.db
    .query("gamePlayers")
    .withIndex("by_session_id", (q) => q.eq("session_id", session.session_id))
    .collect();
  const winners = allPlayers
    .map((p) => ({ player: p, finalScore: updatedScores[p.user_id] ?? p.score }))
    .filter(({ finalScore }) => finalScore >= WINNING_SCORE);

  if (winners.length > 0 && session.status !== "ended") {
    await ctx.db.patch(session._id, { status: "ended" });

    await logGameEvent(ctx, {
      event_type: "session_ended",
      session: { session_id: session.session_id, room_id: session.room_id, mode: session.mode },
      user_id: winners[0].player.user_id,
      round_number: round.round_number,
      metadata: { reason: "winning_score_reached", winning_score: winners[0].finalScore },
    });

    // H3's Leaderboard.tsx renders any time session.status === "ended", so
    // this message is a heads-up in chat, not the leaderboard's own UI.
    await postSystemMessage(
      ctx,
      session,
      winners.length === 1
        ? `${winners[0].player.username || "A player"} reached ${WINNING_SCORE} points — game over! Check the leaderboard.`
        : `The winning score of ${WINNING_SCORE} points has been reached — game over! Check the leaderboard.`,
    );
  }

  return { alreadyRevealed: false as const, result };
}

/**
 * F1c + F1d entry point, called by `gamePresence.ts` (a plain function
 * import, not a mutation reference — see file header) from both `goOffline`
 * and `markStaleDisconnected`, once a player's `connected` flag has just
 * been flipped to `false` in the same transaction. No-ops quietly (never
 * throws) for anything that isn't "this specific player was, at this exact
 * moment, blocking round progress":
 *   - No session, an ended session, or no current round: nothing to do.
 *   - `"speaking"` round where the disconnected player ISN'T the current
 *     speaker: nothing to do — only the player actually holding the floor
 *     right now gets skipped (F1c). A disconnected player later in the
 *     speaking order is simply skipped over normally once their turn comes,
 *     the same as any other `advanceSpeakerPure` transition — no special
 *     casing needed there since `applyAdvance` always moves forward, not
 *     onto whoever's next by connection status.
 *   - `"speaking"` round where they ARE the current speaker: ends their
 *     turn immediately via the same `applyAdvance` the manual "your turn
 *     expired, anyone can nudge" path and the B4 scheduled timer both use —
 *     no new state-transition logic, just an earlier trigger for the
 *     existing one. Safe against the existing scheduled `autoAdvanceOnExpiry`
 *     job for this same turn: that job's own stale-token check
 *     (`turn_expires_at` no longer matching) already makes it a no-op once
 *     this function has moved the round on, same protection B4 already
 *     built for the manual-advance-races-the-timer case.
 *   - `"voting"` round: re-runs the exact same connected-required-voters
 *     check `castVote` uses (F1d) — the disconnected player themselves is
 *     now excluded from that requirement, so this call can itself be what
 *     pushes "everyone required has voted" to true, when no further
 *     `castVote` call is coming to notice that on its own.
 *   - `"revealed"` round: nothing to do — there's no forward progress left
 *     to unstick.
 */
export async function handlePlayerDisconnected(
  ctx: MutationCtx,
  session_id: string,
  disconnectedUserId: string,
) {
  const session = await ctx.db
    .query("gameSessions")
    .withIndex("by_session_id", (q) => q.eq("session_id", session_id))
    .first();
  if (!session || session.status === "ended") return;

  const round = await findRound(ctx, session_id, session.current_round);
  if (!round) return;

  if (round.status === "speaking") {
    const currentIndex = round.current_speaker_index ?? -1;
    const currentSpeakerId =
      currentIndex >= 0 && currentIndex < round.speaking_order.length
        ? round.speaking_order[currentIndex]
        : null;
    if (currentSpeakerId === disconnectedUserId) {
      await applyAdvance(ctx, session, round);
    }
    return;
  }

  if (round.status === "voting") {
    const votedIds = new Set(round.votes.map((v) => v.voter_id));
    const requiredVoters = await getConnectedRequiredVoters(ctx, session_id, round.speaking_order);
    const allVoted = requiredVoters.every((userId) => votedIds.has(userId));
    if (allVoted) {
      await performReveal(ctx, session, round);
    }
    return;
  }

  // "revealed" — nothing to do.
}

export const castVote = mutation({
  args: { session_id: v.string(), voted_for_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
    if (!session) return { error: "Session not found" };
    if (session.status === "ended") return { error: "Session has ended" };

    const round = await findRound(ctx, args.session_id, session.current_round);
    if (!round || round.status !== "voting") {
      return { error: "This round isn't accepting votes right now" };
    }

    const voter = await getGamePlayer(ctx, args.session_id, identity.subject);
    if (!voter) return { error: "Not a player in this session" };

    if (args.voted_for_id === identity.subject) {
      return { error: "You can't vote for yourself" };
    }

    const target = await getGamePlayer(ctx, args.session_id, args.voted_for_id);
    if (!target) return { error: "Can't vote for someone who isn't in this session" };

    // Upsert: casting again before reveal changes your vote rather than
    // adding a second one. Cheap since a round's vote list tops out at
    // `capacity` entries (<=10).
    const votesWithoutMine = round.votes.filter((v) => v.voter_id !== identity.subject);
    const updatedVotes = [...votesWithoutMine, { voter_id: identity.subject, voted_for_id: args.voted_for_id }];

    await ctx.db.patch(round._id, { votes: updatedVotes });

    // Auto-reveal once every CONNECTED player who was dealt into this round
    // has cast a vote (F1d — see file header's DISCONNECT-AWARE ROUND FLOW
    // note for why this is connected-only, not literally everyone in
    // speaking_order), so the group doesn't have to separately click
    // "reveal" after the last required vote lands.
    const votedIds = new Set(updatedVotes.map((v) => v.voter_id));
    const requiredVoters = await getConnectedRequiredVoters(ctx, args.session_id, round.speaking_order);
    const allVoted = requiredVoters.every((userId) => votedIds.has(userId));

    if (allVoted) {
      const outcome = await performReveal(ctx, session, { ...round, votes: updatedVotes });
      return { success: true, allVoted: true, ...outcome };
    }

    return {
      success: true,
      allVoted: false,
      votesSoFar: updatedVotes.filter((v) => requiredVoters.includes(v.voter_id)).length,
      votesNeeded: requiredVoters.length,
    };
  },
});

export const revealRound = mutation({
  args: { session_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
    if (!session) return { error: "Session not found" };
    if (session.status === "ended") return { error: "Session has ended" };

    const round = await findRound(ctx, args.session_id, session.current_round);
    if (!round) return { error: "No round to reveal" };
    if (round.status === "speaking") {
      return { error: "Round is still in the speaking phase" };
    }

    const caller = await getGamePlayer(ctx, args.session_id, identity.subject);
    if (!caller) return { error: "Only players in this session can reveal a round" };

    const outcome = await performReveal(ctx, session, round);
    return { success: true, ...outcome };
  },
});

/**
 * The single client-facing subscription for "what's happening in the
 * current round" — current speaker, turn deadline, live vote tally, and
 * (only once revealed) the full outcome. Deliberately consolidated into one
 * query rather than three separate ones (current round / current speaker /
 * live vote tally, as phrased in the project plan): a round-view UI wants
 * all of it from a single subscription anyway, and splitting it into
 * multiple queries would mean re-deriving "am I the off-signal player"
 * redaction logic in more than one place for no real benefit.
 *
 * Returns `null` if: not authenticated, session doesn't exist, or no round
 * has started yet (`session.current_round === 0`) — callers should treat
 * `null` as "show a waiting/pre-round state", not as an error.
 */
export const getRoundView = query({
  args: { session_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
    if (!session) return null;

    const round = await findRound(ctx, args.session_id, session.current_round);
    if (!round) return null;

    const isRevealed = round.status === "revealed";

    // Redaction: only tell each viewer their own word. Someone who wasn't
    // dealt into this round (joined after it started, or already left)
    // gets no word at all rather than defaulting to word_main.
    const isPlayerInRound = round.speaking_order.includes(identity.subject);
    const isOffSignalViewer = identity.subject === round.offsignal_user_id;
    const myWord = !isPlayerInRound
      ? null
      : isOffSignalViewer
        ? round.word_offsignal
        : round.word_main;

    const currentSpeakerUserId =
      round.status === "speaking" &&
      round.current_speaker_index != null &&
      round.current_speaker_index >= 0 &&
      round.current_speaker_index < round.speaking_order.length
        ? round.speaking_order[round.current_speaker_index]
        : null;

    // Live tally + "who's voted" are visible to everyone during voting (and
    // remain visible after reveal, same numbers computeRoundResult uses) —
    // reuses A4's tallyVotes rather than re-summing votes by hand here.
    const voteTally = tallyVotes(round.votes);
    const votedUserIds = round.votes.map((vote) => vote.voter_id);
    const hasIVoted = votedUserIds.includes(identity.subject);
    // F1d: the actual "who must vote for reveal" roster — connected
    // subset of speaking_order, same helper castVote/handlePlayerDisconnected
    // use to decide when to auto-reveal. Exposed here so the UI's "X/Y
    // voted" denominator matches the real trigger condition instead of
    // recomputing (and risking drifting from) the same logic client-side.
    const requiredVoterIds = await getConnectedRequiredVoters(ctx, args.session_id, round.speaking_order);
    // My own vote only — never who anyone else voted for, which stays
    // aggregate-only (voteTally / votedUserIds) per the file header's "live
    // tally + who's voted, not who-voted-for-whom" redaction rule. Knowing
    // your own pick is never a privacy leak and C4's voting UI needs it to
    // show the current selection (e.g. after a refresh, before reveal).
    const myVotedForId = round.votes.find((vote) => vote.voter_id === identity.subject)?.voted_for_id ?? null;

    return {
      round_number: round.round_number,
      status: round.status,
      speaking_order: round.speaking_order,
      current_speaker_user_id: currentSpeakerUserId,
      turn_expires_at: round.turn_expires_at ?? null,
      voting_expires_at: round.voting_expires_at ?? null,
      my_word: myWord,
      vote_tally: voteTally,
      voted_user_ids: votedUserIds,
      required_voter_ids: requiredVoterIds,
      has_i_voted: hasIVoted,
      my_voted_for_id: myVotedForId,
      // Only populated once revealed — recomputed fresh from stored votes
      // (A4's computeRoundResult), never trusted from a cached field, per
      // the file header's REDACTION note.
      reveal: isRevealed
        ? {
            word_main: round.word_main,
            word_offsignal: round.word_offsignal,
            ...computeRoundResult(round.votes, round.offsignal_user_id),
          }
        : null,
    };
  },
});
