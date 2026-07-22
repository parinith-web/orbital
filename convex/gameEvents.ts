import type { MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";

/**
 * G1 — event logging for the PRD's §8 Success Metrics. This file owns one
 * thing: `logGameEvent`, a thin insert helper into the new `gameEvents`
 * table (schema.ts), called from the handful of existing mutations that
 * already sit at the exact moments those four metrics need a timestamp.
 *
 * DELIBERATELY NOT a metrics/analytics API. G1's own checklist line is
 * "event logging," not "success-metrics dashboard" — this file logs raw,
 * timestamped facts and stops there. Computing the PRD's actual numbers
 * (percentages, averages, correlations) is a downstream job — some future
 * dashboard, script, or ad hoc query — over this table plus the existing
 * `rooms`/`presence` tables, not something this session builds.
 *
 * FOUR EVENT TYPES, MAPPED TO THE PRD'S FOUR METRICS (re-read §8 fresh
 * before writing this, per SIGNAL_PROGRESS.md's own standing convention):
 *
 * 1. "% of active Portal rooms that try Anomaly at least once" (Feature 1
 *    adoption) <- `session_created` events where `mode === "private"`.
 *    Group by `room_id`, count distinct rooms with >=1 such event, divide
 *    by however "active Portal rooms" ends up being defined against the
 *    existing `rooms` table (that denominator is a product decision this
 *    file doesn't make). NOTE: this is *also* reconstructable from the
 *    `gameSessions` table itself today (one private row per room, and
 *    private rows are never deleted) — logged anyway for two reasons: (a)
 *    consistency with the other three metrics, which genuinely can't be
 *    reconstructed from current-state tables (see #2's note below), so
 *    every metric ends up backed by the same one table instead of three
 *    different query shapes, and (b) `gameSessions` rows for *public*
 *    sessions DO get mutated in place by D3's recycle path (see #2), so a
 *    single `gameEvents` table is the one place "did this happen, and
 *    when" stays permanently true regardless of what D3 later does to the
 *    mutable row.
 *
 * 2. "Average time from 'Join a Game' click to round start in the public
 *    lobby" <- pair each `public_join_requested` event with the earliest
 *    `round_started` event on the same `session_id` that happened at or
 *    after it (round_number is whatever `beginRound` was on when it fired
 *    — usually 1 for a freshly-matched player, but a latecomer joining an
 *    already-`"locked"` room mid-round would pair against that in-flight
 *    round's own eventual next `round_started`, not round 1's). WHY THIS
 *    CAN'T BE RECONSTRUCTED FROM CURRENT STATE: D3's recycle path resets
 *    a public `gameSessions` row's `current_round` back to 0 and deletes
 *    its `gameRounds` rows in place, under the *same* `session_id` (see
 *    that file's own doc comment) — so `gameSessions`/`gameRounds` alone
 *    can't tell two different "generations" of the same recycled room
 *    apart after the fact, which this metric needs to. An immutable event
 *    log can.
 *
 * 3. "Public lobby session length and repeat-join rate ('play again'
 *    usage)" <- per-player session length is `player_left_public_session`'s
 *    `created_at` minus that same user's most recent preceding
 *    `public_join_requested` `created_at` on the same `session_id`.
 *    Repeat-join rate reads off `player_left_public_session`'s own
 *    `round_number` (the session's `current_round` at the moment they
 *    left, stashed in `metadata` — see below): `0` means they left before
 *    a single round played, `>=1` means they stuck around for at least one
 *    "play again." Deliberately did NOT add a dedicated "play again
 *    clicked" event distinct from `round_started` — a public session's
 *    `round_started` events already show every additional round a group
 *    collectively chose to keep playing, and cross-referencing which
 *    *specific* players' clicks caused each one adds a second event type
 *    for a distinction this metric doesn't actually need (it wants
 *    "did rounds keep happening," not "who clicked which button").
 *
 * 4. "Whether Anomaly usage correlates with longer overall Portal session
 *    time" <- join any of the above three event types (by `user_id` and
 *    `created_at`) against the existing `presence` table's own
 *    `updated_at` activity trail. No new event type needed here — this
 *    metric is a cross-table correlation over data that already exists
 *    (Anomaly events from this table, overall activity from `presence`),
 *    not something that needs its own instrumentation.
 *
 * WHY ONE TABLE / ONE HELPER, NOT FOUR: every event type shares the same
 * shape (session_id, room_id, mode, optional user_id, optional
 * round_number, optional metadata, created_at) and the same "fire and
 * move on" call pattern from a mutation that's already doing the real
 * work — mirrors this codebase's other single-shared-helper choices
 * (`postSystemMessage` in gameRounds.ts, `seatPlayerInSession` in
 * gameSessions.ts) rather than one bespoke insert per call site.
 *
 * WHY NOT BLOCKING/CRITICAL: `logGameEvent` is called *after* the mutation
 * it's instrumenting has already committed its real state change (or, in
 * Convex's case, within the same transaction but logically an
 * afterthought) — a failure to log should never be why a player couldn't
 * join a game or start a round. There's nothing to actually make this
 * "non-blocking" in Convex's transactional model (a mutation either
 * commits everything or nothing), but the call sites are ordered so this
 * is always the last thing a handler does after its real work, not a
 * precondition gating it.
 *
 * `user_id` is optional because `round_started` fires from the autostart
 * countdown job (no authenticated caller) as well as a player's explicit
 * "Start round"/"Next round" click — the trigger itself is recorded in
 * `metadata` instead (`{"trigger":"manual"}` / `{"trigger":"autostart"}`)
 * so downstream analysis can tell the two apart without needing a caller
 * identity that genuinely doesn't exist for one of them.
 */

export type GameEventType =
  | "session_created"
  | "public_join_requested"
  | "round_started"
  | "player_left_public_session"
  // H2 — logged once by gameRounds.ts's performReveal, the instant any
  // player's score crosses lobbyConfig.ts's WINNING_SCORE right after a
  // reveal. `metadata` carries `{"reason":"winning_score_reached",
  // "winning_score": <final score>}`; `user_id` is the winner (or the
  // first player found over the line on a multi-winner reveal).
  | "session_ended"
  // H8 — logged once by gameSessions.ts's `rematchSession`, the moment a
  // fresh `gameSessions` row replaces an ended one in the same room.
  // Deliberately NOT folded into `session_created` above, even though the
  // insert shape is identical (a fresh session + an auto-enrolled
  // roster): metric #1 counts `session_created` events to answer "did
  // this room ever try Anomaly at all" — a second, third, Nth rematch in
  // the same room isn't a new room adopting Anomaly, and logging it as
  // another `session_created` would overstate raw event volume for
  // anything downstream that counts events rather than distinct rooms
  // (see #1's own note above for why that distinction already mattered
  // once, for D3's recycled public rows). `metadata` carries
  // `{"previous_session_id": <the ended session's session_id>}` so a
  // rematch chain can be walked backward if ever needed; `user_id` is
  // whoever triggered the rematch (the host, or the disconnected-host
  // fallback caller — see `rematchSession`'s own doc comment).
  | "session_rematched";

export async function logGameEvent(
  ctx: MutationCtx,
  event: {
    event_type: GameEventType;
    session: Pick<Doc<"gameSessions">, "session_id" | "room_id" | "mode">;
    user_id?: string;
    round_number?: number;
    metadata?: Record<string, string | number | boolean>;
  },
) {
  await ctx.db.insert("gameEvents", {
    event_type: event.event_type,
    session_id: event.session.session_id,
    room_id: event.session.room_id,
    mode: event.session.mode,
    user_id: event.user_id,
    round_number: event.round_number,
    metadata: event.metadata ? JSON.stringify(event.metadata) : undefined,
    created_at: Date.now(),
  });
}
