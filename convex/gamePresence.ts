import { mutation, internalMutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { handlePlayerDisconnected } from "./gameRounds";
import { maybeMarkSessionEmptiedByDisconnect } from "./gameSessions";

/**
 * F1a — disconnect detection + the `gamePlayers.connected` write path.
 *
 * SCOPE (per SIGNAL_PROGRESS.md's F1 split): this file's only job is
 * getting `connected` to actually flip to `false` when a player goes away,
 * and back to `true` when they come back. It does NOT decide what a
 * disconnected player's turn/vote does to round flow — that's F1c
 * (skip a disconnected speaker) and F1d (voting-phase stall policy).
 * It does NOT add reconnect-specific UI — that's F1e.
 *
 * F1b ADDENDUM (this file's own race-hardening piece): a stale `goOffline`
 * from a closing tab can land *after* a fresher reconnect (a new tab's
 * first `heartbeat`, or `seatPlayerInSession`'s reconnect branch in
 * `gameSessions.ts`) has already re-marked the same `gamePlayers` row
 * `connected: true`, wrongly flipping a genuinely-back player to
 * disconnected until their next heartbeat tick papers over it. Guarded via
 * `gamePlayers.active_connection_id` (see schema.ts's own comment): every
 * write that establishes "this connection is live" — `heartbeat` here, and
 * the reconnect branch of `seatPlayerInSession` — stamps the caller's
 * client-generated `connection_id` (see `src/lib/games/connectionId.ts`)
 * onto that field; `goOffline` only actually disconnects if the id it's
 * carrying still matches what's currently stored, i.e. no newer connection
 * has superseded it. `connection_id` is optional everywhere on purpose —
 * an omitted id (an older client build, or a caller that isn't the
 * presence hook at all) simply skips the guard and falls back to F1a's
 * original unconditional behavior, so this can't regress any existing
 * caller.
 *
 * F1c ADDENDUM: flipping `connected` to `false` (either layer) now also
 * calls `gameRounds.ts`'s `handlePlayerDisconnected` in the same
 * transaction — a plain function import, not a mutation reference, same
 * constraint D1's `seatPlayerInSession` extraction hit (Convex mutations
 * can't call other mutations directly). That function is what actually
 * ends a disconnected current speaker's turn early and re-checks a stalled
 * voting phase; see gameRounds.ts's own DISCONNECT-AWARE ROUND FLOW note
 * for the full reasoning. This file's own job stays exactly what F1a/F1b's
 * headers already say — detecting and recording connection state — it just
 * now also reports that state change to the one place that acts on it.
 *
 * F3 ADDENDUM: flipping `connected` to `false` (either layer, same as the
 * F1c addendum above) now *also* calls `gameSessions.ts`'s
 * `maybeMarkSessionEmptiedByDisconnect` — a public room whose every player
 * disconnects without anyone calling `leaveSession` needs D3's
 * recycle-vs-retire clock started from here, since `leaveSession` itself
 * never fires in that scenario. See that function's own doc comment, and
 * `gameSessions.ts`'s file header ("CLEANUP, GHOST-ROOM EDGE CASE"), for
 * the full problem this closes. Cheap to call unconditionally: it's a
 * no-op indexed collect for any private session or any session that still
 * has another connected player.
 *
 * WHY A SEPARATE FILE FROM presence.ts, NOT AN EXTENSION OF IT: considered
 * piggybacking on the existing global `presence` table/heartbeat instead of
 * building a second one, since the shapes look similar. Rejected because
 * the two track genuinely different things on genuinely different
 * timescales: `presence` is "is this user's client open at all, anywhere in
 * Orbital" on a multi-minute cadence (3min heartbeat / 5min stale) — fine
 * for an online/away dot, far too slow for a game where a 30s turn timer
 * (turnOrder.ts's DEFAULT_TURN_DURATION_MS) is the unit of time that
 * matters. A player who's still globally "online" (browsing another Orbital
 * tab, or just idle without having blurred/backgrounded this one) but whose
 * game client silently dropped its connection would sit "connected: true"
 * for minutes under presence.ts's cadence — long enough to stall an entire
 * round. This file uses its own much tighter interval instead (see
 * constants below), scoped per-session-membership (`gamePlayers`, not a
 * global per-user table), rather than trying to retrofit two different
 * staleness contracts onto one table.
 *
 * TWO-LAYER SHAPE (same as presence.ts / useGlobalPresence.ts):
 *   Layer 1 — instant: client calls `goOffline` on `beforeunload`/`pagehide`
 *     for the clean-close case (tab closed, navigated away, refreshed).
 *   Layer 2 — fallback: client calls `heartbeat` on a fixed interval while
 *     mounted; `markStaleDisconnected` (this file's sweep) flips anyone
 *     whose last heartbeat is older than the stale threshold to
 *     `connected: false`, catching the "network died / tab froze" case
 *     that never fires `beforeunload` at all.
 *
 * SCHEDULING SHAPE — deliberately mirrors D3's fixed-cadence sweep, NOT
 * presence.ts's cancel-and-reschedule-on-every-heartbeat shape. presence.ts
 * pushes a single global deadline forward on every heartbeat because its
 * question is "how long since *any* activity from this user" — the
 * deadline itself is what matters, so it's cheap and correct to keep
 * moving it. This file's question is "is *this specific* row's heartbeat
 * older than a fixed threshold right now," independently for every player
 * in every live session — cancelling and reinserting a shared job on every
 * single player's heartbeat (which, unlike presence.ts's 3-minute cadence,
 * fires every `HEARTBEAT_INTERVAL_MS` per player) would mean near-constant
 * scheduler churn across a full room. Instead: `heartbeat` only ever kicks
 * the sweep off if it isn't already running (no-op otherwise, same as D3's
 * `scheduleCleanupSweepIfNeeded`), and the sweep re-schedules itself on a
 * fixed cadence for as long as any `connected: true` gamePlayers row
 * exists anywhere, going dormant once none do.
 */

// 10s heartbeat / 25s stale threshold — deliberately much tighter than
// presence.ts's 3min/5min. A 30s turn timer is the relevant unit of time
// here (see file header); this threshold needs to resolve well inside a
// single turn, not across several. 2.5x the heartbeat interval mirrors
// presence.ts's own margin (5min stale / 3min heartbeat ≈ 1.67x rounded up
// to "a couple of missed beats") — enough slack to absorb one dropped
// heartbeat tick without falsely flagging a brief blip as a disconnect.
export const HEARTBEAT_INTERVAL_MS = 10 * 1000;
export const STALE_THRESHOLD_MS = 25 * 1000;

/**
 * F1a: ensures exactly one staleness sweep is pending — mirrors D3's
 * `scheduleCleanupSweepIfNeeded` exactly (no-op if a sweep is already
 * scheduled; that pending sweep will see this heartbeat's fresh
 * `last_heartbeat_at` whenever it next runs).
 */
async function scheduleGamePresenceSweepIfNeeded(ctx: MutationCtx) {
  const existing = await ctx.db.query("gamePresenceCleanupScheduler").first();
  if (existing) return;
  const jobId = await ctx.scheduler.runAfter(
    HEARTBEAT_INTERVAL_MS,
    internal.gamePresence.markStaleDisconnected,
    {},
  );
  await ctx.db.insert("gamePresenceCleanupScheduler", { jobId });
}

/**
 * Layer 2 — fallback heartbeat. Called on a fixed client-side interval
 * (see `src/hooks/useGameSessionPresence.ts`) while a player has the game
 * UI mounted. Marks them connected and refreshes their heartbeat clock;
 * also doubles as the reconnect signal for a player who'd already gone
 * stale (there's no separate "reconnect" mutation in this file — a fresh
 * heartbeat IS a reconnect, same as `seatPlayerInSession`'s existing
 * reconnect branch already treats a fresh `joinSession` call).
 */
export const heartbeat = mutation({
  args: { session_id: v.string(), connection_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const player = await ctx.db
      .query("gamePlayers")
      .withIndex("by_user_session", (q) =>
        q.eq("user_id", identity.subject).eq("session_id", args.session_id),
      )
      .first();
    if (!player) return { error: "Not a player in this session" };

    // F1b: a heartbeat always represents "this connection is live right
    // now," so it unconditionally claims active_connection_id when the
    // caller supplies one — no comparison needed here (unlike goOffline
    // below), since establishing liveness is exactly what should always
    // win. Omitted entirely (no `connection_id` key at all) if the caller
    // didn't pass one, rather than patching it to `undefined` — leaves
    // whatever a previous call already stored untouched instead of
    // clobbering it.
    await ctx.db.patch(player._id, {
      connected: true,
      last_heartbeat_at: Date.now(),
      ...(args.connection_id !== undefined
        ? { active_connection_id: args.connection_id }
        : {}),
    });

    await scheduleGamePresenceSweepIfNeeded(ctx);

    return { success: true as const };
  },
});

/**
 * Layer 1 — instant explicit disconnect. Called from the client's
 * `beforeunload`/`pagehide` handlers, same trigger presence.ts's own
 * `goOffline` uses. Unlike presence.ts's `goOffline`, this does NOT delete
 * the `gamePlayers` row — that row represents actual game participation
 * (score, seat in `speaking_order`, etc.), not just an online marker, and
 * deleting it on every tab-close would be indistinguishable from
 * `leaveSession` (a genuine "left the game" action) which this explicitly
 * is not. Silently no-ops (no error) if the caller isn't a player in this
 * session or isn't authenticated — mirrors presence.ts's own
 * `goOffline` shape, since a `beforeunload` handler firing after a player
 * already left is an expected race, not a real error.
 */
export const goOffline = mutation({
  args: { session_id: v.string(), connection_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { success: true as const };

    const player = await ctx.db
      .query("gamePlayers")
      .withIndex("by_user_session", (q) =>
        q.eq("user_id", identity.subject).eq("session_id", args.session_id),
      )
      .first();
    if (!player) return { success: true as const };

    // F1b: only skip the disconnect if this call can actually prove it's
    // stale — i.e. it named a connection id, the row has a *different*
    // connection id on record, meaning some fresher connection (a new
    // tab's heartbeat, or a reconnect) has already taken over since this
    // one started closing. Any other combination (no id supplied by
    // either side, ids match, or the row has never recorded one) falls
    // through to the original unconditional disconnect — this is a guard
    // against a proven-stale signal, not a default "trust the caller"
    // skip.
    const supersededByNewerConnection =
      args.connection_id !== undefined &&
      player.active_connection_id !== undefined &&
      player.active_connection_id !== args.connection_id;
    if (supersededByNewerConnection) {
      return { success: true as const, skipped: true as const };
    }

    await ctx.db.patch(player._id, { connected: false });

    // F1c/F1d: this connection just went away for real (not superseded by
    // a fresher one) — let round flow react if it needs to (skip a
    // disconnected current speaker, or re-check a stalled voting phase).
    await handlePlayerDisconnected(ctx, args.session_id, identity.subject);

    // F3: also let D3's cleanup know, in case this was the last connected
    // player in a public room and nobody's coming back to call
    // `leaveSession` — see this file's F3 addendum above.
    await maybeMarkSessionEmptiedByDisconnect(ctx, args.session_id);

    return { success: true as const };
  },
});

/**
 * The staleness sweep. Finds every `connected: true` gamePlayers row whose
 * `last_heartbeat_at` is older than `STALE_THRESHOLD_MS` and flips it to
 * `false`, via the indexed `by_connected_heartbeat` range (connected ==
 * true, last_heartbeat_at < cutoff) rather than a full-table scan — same
 * indexed-lookup preference D3/presence.ts's own sweeps already use.
 *
 * Deliberately does NOT scope by session status (waiting/in_progress/
 * ended) — an ended session's players going "stale" is harmless (nothing
 * reads `connected` for a session that's already over), and adding that
 * filter would mean an extra per-row session lookup for no behavioral
 * payoff. Kept simple on purpose; revisit only if that ever turns out to
 * matter.
 *
 * Re-derives whether to keep sweeping from a live check ("does any
 * `connected: true` row exist at all") rather than trusting whatever this
 * run just did — mirrors `sweepEmptyPublicSessions`'s own
 * `anyStillEmptyAndPending` pattern of checking real state, not assuming.
 */
export const markStaleDisconnected = internalMutation({
  args: {},
  handler: async (ctx) => {
    // The job that's running right now is no longer "pending" — clear the
    // tracker first, same reasoning as presence.ts's cleanupStalePresence
    // and gameSessions.ts's sweepEmptyPublicSessions: a heartbeat landing
    // mid-sweep should schedule a genuinely fresh follow-up, not assume
    // this in-flight run will cover it.
    const scheduler = await ctx.db.query("gamePresenceCleanupScheduler").first();
    if (scheduler) {
      await ctx.db.delete(scheduler._id);
    }

    const cutoff = Date.now() - STALE_THRESHOLD_MS;
    const stalePlayers = await ctx.db
      .query("gamePlayers")
      .withIndex("by_connected_heartbeat", (q) =>
        q.eq("connected", true).lt("last_heartbeat_at", cutoff),
      )
      .collect();

    for (const player of stalePlayers) {
      await ctx.db.patch(player._id, { connected: false });
      // F1c/F1d: same reasoning as goOffline above — a player going stale
      // via the sweep (not a clean tab close) is just as capable of being
      // a stuck current speaker or the last non-voter blocking reveal.
      await handlePlayerDisconnected(ctx, player.session_id, player.user_id);
    }

    // F3: same reasoning as goOffline's call, but deduped by session_id —
    // a room where several players go stale in the same sweep pass would
    // otherwise redo this indexed collect once per stale player instead of
    // once per affected session. `maybeMarkSessionEmptiedByDisconnect`
    // itself re-derives connectedness live, so calling it once per session
    // after the loop above (rather than inline per-player) is correct: by
    // the time it runs, every stale player in this batch has already been
    // patched to `connected: false`, so a session where the *last*
    // remaining connections all went stale in this same pass is seen as
    // fully empty, not missed because it was checked one player too early.
    const staleSessionIds = new Set(stalePlayers.map((p) => p.session_id));
    for (const sessionId of staleSessionIds) {
      await maybeMarkSessionEmptiedByDisconnect(ctx, sessionId);
    }

    const anyStillConnected = await ctx.db
      .query("gamePlayers")
      .withIndex("by_connected_heartbeat", (q) => q.eq("connected", true))
      .first();

    if (anyStillConnected) {
      const jobId = await ctx.scheduler.runAfter(
        HEARTBEAT_INTERVAL_MS,
        internal.gamePresence.markStaleDisconnected,
        {},
      );
      await ctx.db.insert("gamePresenceCleanupScheduler", { jobId });
    }
  },
});
