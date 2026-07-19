import { mutation, query, internalMutation, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { maybeCancelAutostartCountdown, postSystemMessage } from "./gameRounds";
import { logGameEvent } from "./gameEvents";

/**
 * Session + player lifecycle for Signal game sessions — B1.
 *
 * SCOPE (per SIGNAL_PROGRESS.md's Phase B breakdown): this file covers
 * *private/in-room* session creation only. Public-lobby matchmaking
 * (find-an-open-room-or-spin-up-a-new-one) is Phase D (D1) and lives in
 * `convex/publicMatchmaking.ts`. `joinSession`'s actual seat-or-reconnect
 * logic is factored out into the exported `seatPlayerInSession` helper
 * below specifically so D1 can call straight into it once it has picked
 * or created a public `gameSessions` row, instead of re-implementing
 * player-roster CRUD a second time (mutations can't call other mutations
 * directly in Convex, only plain functions — hence the extraction rather
 * than D1 just invoking the `joinSession` mutation itself).
 * `leaveSession` / `getSessionPlayers` remain mode-agnostic too, same
 * reasoning.
 *
 * END-SESSION (C7): `endSession` below is the explicit "stop this Signal
 * game" action from Feature 1's flow — distinct from `leaveSession` (one
 * player stepping out) and distinct from C2's panel close (a pure UI
 * dismissal that never touches this table at all). Ending only ever
 * patches the `gameSessions` row itself (`status: "ended"`) and posts one
 * `messages` row through gameRounds.ts's `postSystemMessage` helper — it
 * does not touch `gamePlayers`, `gameRounds`, `calls`, or `roomMembers`,
 * and does not delete anything, so the room's underlying call/chat and
 * this session's own history are both left completely intact. Rounds
 * in-flight are stopped via the ended-session guards added to
 * gameRounds.ts's mutations/scheduled job in the same session, not by
 * reaching into that table from here.
 *
 * CLEANUP (D3): recycle-vs-retire for emptied *public* rooms — see the
 * dedicated doc comment further down, directly above the
 * `CLEANUP_CHECK_INTERVAL_MS`/`RETIRE_THRESHOLD_MS` constants, for the
 * full design.
 *
 * CLEANUP, GHOST-ROOM EDGE CASE (F3): D3 as originally landed only ever
 * learns a public room is empty via `leaveSession` deleting the last
 * `gamePlayers` row. A player whose tab crashes, loses network, or gets
 * force-quit never calls `leaveSession` — `gamePresence.ts`'s F1a/F1b
 * layers flip their row to `connected: false` instead, and that row just
 * sits there forever. If every player in a public room disconnects that
 * way without anyone formally leaving, the room's `gamePlayers.length`
 * never reaches 0, so `sweepEmptyPublicSessions` never even starts the
 * clock — the room stays `"locked"`/`"in_progress"` and un-recyclable
 * indefinitely. That's exactly the "unbounded stale rooms accumulating"
 * failure the PRD's §7 cleanup section (and D3's own doc comment) exists
 * to prevent — it's just reached from a disconnect instead of a leave.
 * `maybeMarkSessionEmptiedByDisconnect` below, and the switch from a raw
 * row-count check to a *connected*-row-count check inside the sweep
 * itself, are F3's fix for this. See `maybeMarkSessionEmptiedByDisconnect`
 * for the full design.
 */

/** Shared across private + (future) public sessions — "Signal's supported range" per the PRD. */
export const DEFAULT_SESSION_CAPACITY = 10;

/**
 * D3 — recycle-vs-retire cleanup for emptied *public* rooms only.
 *
 * SCOPE: the PRD's own "Room cleanup" section (§7, Technical Considerations)
 * frames this specifically as retiring "empty or long-idle **public** game
 * rooms" — private/in-room sessions belong to a persistent Portal room and
 * already have their own explicit end-of-life action (C7's `endSession`);
 * there's no matchmaking pool for them to leak into, so they're left alone
 * here. Every cleanup function below filters to `mode === "public"`.
 *
 * THE RULE (portal_1.md's locked-in default, restated in this file's own
 * terms): once a public session's live player count hits 0 (tracked via
 * `last_emptied_at`, already stamped by `leaveSession` since B1),
 *   - if it's been empty for LESS than `RETIRE_THRESHOLD_MS` (5 min): RECYCLE
 *     — reset it back to a fresh, joinable `"waiting"` room *under the same
 *     `room_id`/`session_id`* so matchmaking can hand it straight back out.
 *     If it's already `"waiting"` (never filled/started before going empty),
 *     there's nothing to reset — recycling is then just "leave it alone,
 *     it's already recyclable."
 *   - if it's been empty for `RETIRE_THRESHOLD_MS` or longer: RETIRE —
 *     `status: "ended"`, terminal. Per the PRD's own D3 line ("rooms that
 *     hit capacity and lock always get a new instance regardless"),
 *     matchmaking's `findOrCreatePublicSession` already mints a brand new
 *     `session_id`/`room_id` the next time it needs a fresh room — nothing
 *     here needs to "mint" anything on retirement, retiring is purely
 *     "stop offering this one."
 *
 * SCHEDULING SHAPE: unlike B4's per-round turn timer (many rounds, each
 * with its own independent deadline — B4's own notes explicitly rejected
 * copying `presence.ts`'s singleton-poller pattern for that reason), D3's
 * job genuinely is a single global sweep: "are there any empty public
 * rooms that need a recycle-or-retire decision right now." That's exactly
 * `presence.ts`'s `presenceCleanupScheduler` shape, so this *does* mirror
 * it directly — one singleton tracker row (`gameSessionCleanupScheduler`),
 * cancelled/reinserted rather than allowed to pile up, self-rescheduling
 * only while there's still empty-but-not-yet-retired work to check again
 * later, dormant (no job in flight) once there isn't. `leaveSession` below
 * is this file's equivalent of presence.ts's `update`/`heartbeat` — the
 * activity that (re)kicks the sweep off.
 *
 * WHY CHECK EVERY MINUTE, NOT EVERY 5: recycling should happen promptly —
 * a `"locked"`/`"in_progress"` room that just emptied should become
 * rejoinable again well before the full 5-minute retire grace period
 * elapses, not sit unreachable by matchmaking for up to 5 minutes for no
 * reason. The 5-minute number is the *retire* threshold, not the sweep
 * cadence.
 */
const CLEANUP_CHECK_INTERVAL_MS = 60 * 1000; // 1 minute — sweep cadence
export const RETIRE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes — portal_1.md default

/**
 * App-level id distinct from Convex's own auto `_id`, same reason
 * `rooms.room_id` is a separate field from `_id`. Mirrors the existing
 * `generateRoomCode()` pattern (Math.random-based) rather than assuming
 * `crypto.randomUUID` is available in the Convex runtime.
 *
 * `prefix` defaults to "signal" (session ids) but is exported/parameterized
 * so D1's public matchmaking can reuse the exact same generator for a
 * public session's synthetic `room_id` too (e.g. `generateSessionId("public_room")`)
 * instead of a second copy of the same timestamp+random scheme.
 */
export function generateSessionId(prefix: string = "signal"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

async function getUserSummary(ctx: MutationCtx, userId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .first();
  return { username: user?.username, avatar: user?.avatar };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

/** The room's current live session, if any (any status other than "ended"). */
export const getSessionByRoomId = query({
  args: { room_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameSessions")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .filter((q) => q.neq(q.field("status"), "ended"))
      .first();
  },
});

export const getSessionById = query({
  args: { session_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
  },
});

/** Full player roster for a session — the "R" of gamePlayers CRUD. */
export const getSessionPlayers = query({
  args: { session_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gamePlayers")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .collect();
  },
});

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createSession = mutation({
  args: {
    room_id: v.string(),
    capacity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .first();
    if (!room) return { error: "Room not found" };

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_user_room", (q) =>
        q.eq("user_id", identity.subject).eq("room_id", args.room_id),
      )
      .first();
    if (!membership) return { error: "Not a member of this room" };

    // Idempotent: if this room already has a live session, hand back its id
    // instead of erroring — covers double-clicking "Play Signal" and lets
    // the caller just route straight into the existing session.
    const existing = await ctx.db
      .query("gameSessions")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .filter((q) => q.neq(q.field("status"), "ended"))
      .first();
    if (existing) {
      return { session_id: existing.session_id, alreadyExists: true as const };
    }

    const roomMembers = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .collect();

    // Capacity defaults to at least the current roster size, so the
    // bulk-enroll below can never itself exceed the session's own cap.
    const capacity = Math.max(
      args.capacity ?? DEFAULT_SESSION_CAPACITY,
      roomMembers.length,
    );

    const session_id = generateSessionId();
    await ctx.db.insert("gameSessions", {
      session_id,
      room_id: args.room_id,
      mode: "private",
      status: "waiting",
      capacity,
      current_round: 0,
      created_at: Date.now(),
    });

    // Auto-enroll the room's current roster (Feature 1: "using the room's
    // existing roster and existing voice call — no separate lobby, no
    // re-invite step"). Safe to insert directly without a per-member
    // existence check: session_id was just minted above, so no gamePlayers
    // rows can exist for it yet.
    //
    // NOTE: intentionally NOT enforcing a 3-player minimum here. The
    // engine's own defensive checks (pickOffSignalPlayer /
    // generateSpeakingOrder in convex/games/) already throw below 3
    // players, and *when* it's OK to start a round is B2's concern
    // (startRound), not session creation.
    await Promise.all(
      roomMembers.map((member) =>
        ctx.db.insert("gamePlayers", {
          session_id,
          user_id: member.user_id,
          username: member.username,
          avatar: member.avatar,
          score: 0,
          connected: true,
          // F1a: stamped at seat time (not left undefined) so the
          // staleness sweep's `last_heartbeat_at < cutoff` range check has
          // something well-defined to compare against from the moment a
          // player is seated, rather than treating "never heartbeated yet"
          // as immediately stale before their first heartbeat has even had
          // a chance to land.
          last_heartbeat_at: Date.now(),
        }),
      ),
    );

    // G1: private-mode session_created — the raw event Feature 1 adoption
    // ("% of active Portal rooms that try Signal at least once") is
    // computed from. Logged after the insert + roster enroll above rather
    // than before, so this never fires for a `createSession` call that
    // errored out earlier (not a member, room not found) or short-circuited
    // on the idempotent `alreadyExists` branch above (that's a re-entry
    // into an existing session, not a new "this room tried Signal" fact).
    await logGameEvent(ctx, {
      event_type: "session_created",
      session: { session_id, room_id: args.room_id, mode: "private" },
      user_id: identity.subject,
    });

    return { session_id, alreadyExists: false as const };
  },
});

/**
 * Seats a user into an already-resolved `gameSessions` row — reconnect if
 * they already have a `gamePlayers` row here, otherwise a fresh join
 * gated on `locked`/capacity. This is the actual "add this player to this
 * session" logic shared by `joinSession` (private mode, session_id already
 * known) and D1's `findOrCreatePublicSession` (public mode, the session
 * itself was just found-or-created in the same mutation). Extracted here
 * rather than left inline in `joinSession` specifically so D1 doesn't need
 * a second copy of the reconnect/locked/capacity checks — mutations can't
 * call other mutations directly in Convex, only plain functions, so this
 * had to be pulled out rather than D1 just invoking `joinSession` itself.
 *
 * Callers are responsible for any membership/mode gating that needs to
 * happen *before* seating (e.g. `joinSession`'s private-room-membership
 * check) — this function only knows about the session + gamePlayers rows,
 * nothing about `rooms`/`roomMembers`.
 *
 * LOCK-ON-FULL (D2a): if the player being seated here is the one who fills
 * the session to `capacity`, this flips `status` to `"locked"` in the same
 * transaction as the seat itself — not a separate follow-up write, per the
 * plan's own done-condition ("seating the Nth player leaves the session
 * locked; seating player N-1 leaves it waiting"). Until D2b this was the
 * one and only place any `gameSessions` row's status became `"locked"`; as
 * of D2b, `gameRounds.ts`'s `startRound` is a second path (a public session
 * that hasn't hit capacity but has had a round started on it) — the two
 * don't interact (that transition only ever fires from `"waiting"`, same
 * as this one, and whichever happens first is what a session locks on),
 * so nothing here needed to change for D2b to land.
 *
 * Written mode-agnostically (no `session.mode === "public"` check) even
 * though the PRD frames lock-on-full as a public-lobby concern: the
 * `"locked"` status itself ("full ... not accepting joiners" per its
 * schema.ts comment) is a property of *any* session at capacity, private
 * or public, and private sessions get here rarely (their capacity is set
 * from the room roster at `createSession` time, before any room member has
 * had a chance to call this) but not never — a room that grows after its
 * Signal session was created can still fill it via `joinSession`. No
 * caller-side reason to special-case public here.
 *
 * Only transitions out of `"waiting"`, never out of `"in_progress"`: as of
 * D2b, `gameRounds.ts`'s `startRound` only ever promotes a *private*
 * session to `"in_progress"` (public sessions starting a round go straight
 * to `"locked"` instead — see that file's own LOCK-ON-START note), so this
 * function must never clobber an already-`"in_progress"` private session
 * back to `"locked"` — that would erase the "a round is actually underway"
 * signal, for a case (filling the last seat mid-round) this step was never
 * asked to handle. `"locked"`/`"ended"` sessions can't reach this line at
 * all (rejected above), so `"waiting"` is the only status this check can
 * actually observe here in practice, but the explicit guard is kept anyway
 * so this stays correct if that invariant ever changes.
 */
export async function seatPlayerInSession(
  ctx: MutationCtx,
  session: Doc<"gameSessions">,
  userId: string,
  connectionId?: string,
): Promise<{ error: string } | { success: true; reconnected: boolean; locked: boolean }> {
  const existingPlayer = await ctx.db
    .query("gamePlayers")
    .withIndex("by_user_session", (q) =>
      q.eq("user_id", userId).eq("session_id", session.session_id),
    )
    .first();

  if (existingPlayer) {
    // Reconnect path — always allowed regardless of `locked`, since a
    // player who was already seated shouldn't be shut out by the same
    // lock that keeps *new* joiners from getting in mid-round. Never
    // triggers the lock-on-full check below: reconnecting doesn't change
    // the session's player count, so it can't be the seat that fills it.
    //
    // F1a: also stamps `last_heartbeat_at`, same reasoning as the fresh-seat
    // insert below — a rejoin via this path (e.g. `joinSession` called
    // again, or `publicMatchmaking` seating a returning player) is itself a
    // liveness signal, and without a fresh timestamp here a player who'd
    // gone stale could reconnect and then get immediately re-flagged
    // disconnected by the sweep before their client's own heartbeat
    // interval had a chance to fire.
    //
    // F1b: this reconnect IS a fresh connection taking over, exactly like
    // `heartbeat`'s own claim in gamePresence.ts — same unconditional-claim
    // reasoning applies (see that file's comment), and the same
    // omit-rather-than-clobber handling when the caller didn't pass one.
    await ctx.db.patch(existingPlayer._id, {
      connected: true,
      last_heartbeat_at: Date.now(),
      ...(connectionId !== undefined ? { active_connection_id: connectionId } : {}),
    });
    return { success: true, reconnected: true, locked: session.status === "locked" };
  }

  if (session.status === "locked" || session.status === "ended") {
    return { error: "Session is no longer accepting new players" };
  }

  const currentPlayers = await ctx.db
    .query("gamePlayers")
    .withIndex("by_session_id", (q) => q.eq("session_id", session.session_id))
    .collect();
  if (currentPlayers.length >= session.capacity) {
    return { error: "Session is full" };
  }

  const summary = await getUserSummary(ctx, userId);
  await ctx.db.insert("gamePlayers", {
    session_id: session.session_id,
    user_id: userId,
    username: summary.username,
    avatar: summary.avatar,
    score: 0,
    connected: true,
    last_heartbeat_at: Date.now(), // F1a — see createSession's identical note above
    ...(connectionId !== undefined ? { active_connection_id: connectionId } : {}), // F1b
  });

  // +1 accounts for the player just inserted above — `currentPlayers` was
  // collected before that insert. `session.status === "waiting"` holds
  // here in every case the code can currently reach (see doc comment
  // above); checked explicitly anyway rather than assumed.
  const nowLocked =
    session.status === "waiting" && currentPlayers.length + 1 >= session.capacity;
  if (nowLocked) {
    await ctx.db.patch(session._id, { status: "locked" });
  }

  return { success: true, reconnected: false, locked: nowLocked };
}

export const joinSession = mutation({
  args: { session_id: v.string(), connection_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
    if (!session) return { error: "Session not found" };
    if (session.status === "ended") return { error: "Session has ended" };

    // Private sessions are scoped to the underlying Portal room's roster —
    // only current room members may join, even if they know the session_id.
    // Public sessions (Phase D) have no such gate; that's the whole point.
    if (session.mode === "private") {
      const membership = await ctx.db
        .query("roomMembers")
        .withIndex("by_user_room", (q) =>
          q.eq("user_id", identity.subject).eq("room_id", session.room_id),
        )
        .first();
      if (!membership) {
        return { error: "Only members of this room can join its Signal session" };
      }
    }

    return await seatPlayerInSession(ctx, session, identity.subject, args.connection_id);
  },
});

/**
 * D3: ensures exactly one cleanup sweep is pending, mirroring
 * `presence.ts`'s `update`/`heartbeat` — safe to call every time a public
 * session goes empty; a no-op if a sweep is already scheduled (that sweep
 * will see this session's freshly-stamped `last_emptied_at` when it runs).
 *
 * Exported (not just used by `leaveSession` below) so F3's
 * `maybeMarkSessionEmptiedByDisconnect` — and `gamePresence.ts`'s disconnect
 * paths that call it — can kick the exact same sweep, rather than a second
 * copy of this scheduling logic living in that file.
 */
export async function scheduleCleanupSweepIfNeeded(ctx: MutationCtx) {
  const existing = await ctx.db.query("gameSessionCleanupScheduler").first();
  if (existing) return;
  const jobId = await ctx.scheduler.runAfter(
    CLEANUP_CHECK_INTERVAL_MS,
    internal.gameSessions.sweepEmptyPublicSessions,
    {},
  );
  await ctx.db.insert("gameSessionCleanupScheduler", { jobId });
}

/**
 * F3 — ghost-room detection. Call this after a `gamePlayers` row's
 * `connected` flips to `false` (i.e. from `gamePresence.ts`'s `goOffline`
 * and `markStaleDisconnected`, right alongside their existing call into
 * `handlePlayerDisconnected` for round flow) so a public room whose every
 * player disconnected without anyone calling `leaveSession` still gets
 * D3's emptying clock started. See this file's header comment ("CLEANUP,
 * GHOST-ROOM EDGE CASE") for the full problem statement.
 *
 * Scoped identically to D3 itself: public sessions only, and only those
 * not already `"ended"` (an ended session's players going dark is not
 * this function's concern — nothing reads `last_emptied_at` on a
 * terminal session). Re-derives "is anyone actually here" from a live
 * `gamePlayers` scan rather than trusting the single row that just
 * changed, since that row's disconnect might not be the *last* connected
 * player in the room — same "check real state, don't assume" discipline
 * `sweepEmptyPublicSessions` itself already follows.
 *
 * Only stamps `last_emptied_at` if it isn't already set — a room that's
 * already dark and gets a second, third, Nth stale ghost shouldn't keep
 * pushing its own retire clock forward; the clock starts at the *first*
 * moment nobody was left, exactly like `leaveSession`'s stamp already
 * behaves (it never re-stamps an already-empty session either, since a
 * `gamePlayers` row can't be deleted twice).
 *
 * Cheap to call unconditionally on every disconnect: the common case (a
 * room with other players still connected) is one indexed collect + an
 * early return, no writes.
 */
export async function maybeMarkSessionEmptiedByDisconnect(
  ctx: MutationCtx,
  sessionId: string,
) {
  const session = await ctx.db
    .query("gameSessions")
    .withIndex("by_session_id", (q) => q.eq("session_id", sessionId))
    .first();
  if (!session || session.mode !== "public" || session.status === "ended") return;

  const players = await ctx.db
    .query("gamePlayers")
    .withIndex("by_session_id", (q) => q.eq("session_id", sessionId))
    .collect();
  const anyoneStillConnected = players.some((p) => p.connected);
  if (anyoneStillConnected) return;

  if (session.last_emptied_at === undefined) {
    await ctx.db.patch(session._id, { last_emptied_at: Date.now() });
  }
  await scheduleCleanupSweepIfNeeded(ctx);
}

export const leaveSession = mutation({
  args: { session_id: v.string() },
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

    await ctx.db.delete(player._id);

    const remaining = await ctx.db
      .query("gamePlayers")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .collect();

    // E2: a departure can drop a public lobby back below
    // `min_players_to_start` without emptying it outright — fetched
    // unconditionally (not just inside the `remaining.length === 0` branch
    // below) so that case is covered too, not just the fully-empty one.
    // `maybeCancelAutostartCountdown` itself is a no-op unless a countdown
    // is actually running and the new count is genuinely under threshold,
    // so this is safe to call on every leave.
    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
    if (session) {
      await maybeCancelAutostartCountdown(ctx, session);
    }

    if (remaining.length === 0) {
      if (session) {
        // Only stamp the "went empty" timestamp here — deciding recycle vs.
        // retire off of it is D3's cron job, intentionally not decided here.
        await ctx.db.patch(session._id, { last_emptied_at: Date.now() });

        // D3: public rooms are the only ones with a matchmaking pool to
        // leak into, so only they need the sweep kicked off. See this
        // file's "D3 — recycle-vs-retire" doc comment above for the full
        // scoping rationale.
        if (session.mode === "public") {
          await scheduleCleanupSweepIfNeeded(ctx);
        }
      }
    }

    // G1 — session length + repeat-join signal (PRD §8): only logged for
    // *public* sessions, since that's the metric this event feeds
    // ("public lobby session length and repeat-join rate"). Private/in-room
    // leaves aren't part of that metric and already have their own
    // system-message trail (C6) — no need for a second log here.
    // `round_number: session.current_round` doubles as the repeat-join
    // signal: 0 means this player left before a single round played, >=1
    // means they stuck around for at least one "play again" — see
    // gameEvents.ts's own #3 doc comment for why this reuses that field
    // instead of a separate "rounds played" one.
    if (session && session.mode === "public") {
      await logGameEvent(ctx, {
        event_type: "player_left_public_session",
        session: { session_id: session.session_id, room_id: session.room_id, mode: session.mode },
        user_id: identity.subject,
        round_number: session.current_round,
      });
    }

    return { success: true };
  },
});

/**
 * Ends a Signal session outright — the explicit "End Signal" action from
 * Feature 1's flow (C7), as opposed to `leaveSession` (one player stepping
 * out while the game continues for everyone else) or the panel's own X
 * button (C2's pure UI dismissal, doesn't touch this table at all).
 *
 * Authorization mirrors `startRound`/`revealRound`: any current player in
 * the session can end it — there's no separate "host" concept anywhere in
 * this schema, and requiring the room owner specifically would be a new
 * permission axis not asked for by the PRD.
 *
 * Idempotent: ending an already-ended session is a no-op that returns
 * `{ alreadyEnded: true }` rather than erroring, since two players could
 * plausibly race to be the one who ends it (mirrors `performReveal`'s own
 * `alreadyRevealed` idempotency in gameRounds.ts).
 *
 * Deliberately does NOT touch `gamePlayers`, `gameRounds`, `calls`, or
 * `roomMembers` — only patches this session's own `status` and posts one
 * system message, so the room's underlying call/chat (and this session's
 * own play history, for whatever G1's future metrics pass wants from it)
 * are both left completely intact. In-flight rounds are stopped by the
 * ended-session guards added to gameRounds.ts's mutations/scheduled job in
 * this same session, not by reaching into that table here.
 */
export const endSession = mutation({
  args: { session_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", args.session_id))
      .first();
    if (!session) return { error: "Session not found" };

    if (session.status === "ended") {
      return { success: true, alreadyEnded: true as const };
    }

    const caller = await ctx.db
      .query("gamePlayers")
      .withIndex("by_user_session", (q) =>
        q.eq("user_id", identity.subject).eq("session_id", args.session_id),
      )
      .first();
    if (!caller) return { error: "Only players in this session can end it" };

    await ctx.db.patch(session._id, { status: "ended" });
    await postSystemMessage(ctx, session, "Signal has ended for this room.");

    return { success: true, alreadyEnded: false as const };
  },
});

/**
 * D3 — the actual sweep. Looks at every non-`"ended"` *public* session,
 * decides recycle-vs-retire for the ones that are genuinely empty right
 * now (re-derived from a live `gamePlayers` scan, not just trusted off
 * `last_emptied_at` — a session could have been rejoined since it went
 * empty), and reschedules itself only if empty-but-not-yet-retired work
 * still remains.
 *
 * INDEXED CANDIDATE SET: queries `by_status_mode` three times (`"waiting"`,
 * `"locked"`, `"in_progress"`, each paired with `mode: "public"`) rather
 * than a full `gameSessions` table scan — mirrors this codebase's existing
 * preference for indexed lookups over in-memory filtering wherever an
 * index is available (unlike `gameRounds.ts`'s `findRound`, which scans in
 * memory specifically because no index fits there).
 *
 * F3 — "empty" means zero *connected* players, not zero rows: originally
 * this checked `currentPlayers.length`, which only ever hits 0 once every
 * player has had their `gamePlayers` row deleted by `leaveSession`. A
 * player who disconnects without formally leaving (crash, force-quit,
 * network death) leaves a `connected: false` row behind forever, which
 * kept `currentPlayers.length` above 0 and made an all-ghost room
 * permanently invisible to this sweep — see this file's header ("CLEANUP,
 * GHOST-ROOM EDGE CASE") for the full failure mode this closes. Switching
 * the check to a connected-count also means the recycle branch now needs
 * to actively clear out any lingering disconnected rows itself (a
 * `leaveSession`-emptied room already has none to clear; a ghost-emptied
 * room does) — done below so a recycled room never carries forward
 * phantom occupants that would otherwise still count against its capacity
 * or show up as fake players in the lobby UI.
 */
export const sweepEmptyPublicSessions = internalMutation({
  args: {},
  handler: async (ctx) => {
    // The job that's running right now is no longer "pending" — clear the
    // tracker first, same as `presence.ts`'s `cleanupStalePresence`, so a
    // `leaveSession` call that lands mid-sweep schedules a fresh follow-up
    // instead of assuming this in-flight run will cover it.
    const scheduler = await ctx.db.query("gameSessionCleanupScheduler").first();
    if (scheduler) {
      await ctx.db.delete(scheduler._id);
    }

    const candidates: Doc<"gameSessions">[] = [];
    for (const status of ["waiting", "locked", "in_progress"] as const) {
      const matches = await ctx.db
        .query("gameSessions")
        .withIndex("by_status_mode", (q) => q.eq("status", status).eq("mode", "public"))
        .collect();
      candidates.push(...matches);
    }

    const now = Date.now();
    let anyStillEmptyAndPending = false;

    for (const session of candidates) {
      const currentPlayers = await ctx.db
        .query("gamePlayers")
        .withIndex("by_session_id", (q) => q.eq("session_id", session.session_id))
        .collect();
      // F3: connected-count, not raw row count — see this function's
      // header. `currentPlayers` itself is still needed below (both to
      // decide "any rows to purge at all" and, on retire, purely because
      // it was already fetched), so it stays a full collect either way.
      const connectedPlayers = currentPlayers.filter((p) => p.connected);

      if (connectedPlayers.length > 0) {
        // Someone (re)joined/reconnected since this went empty — not this
        // sweep's concern anymore, even if other stale rows are still
        // sitting in the roster. Clear a stale timestamp if one's still
        // set, purely so the row doesn't misleadingly read "emptied at
        // <time>" while someone's visibly there.
        if (session.last_emptied_at !== undefined) {
          await ctx.db.patch(session._id, { last_emptied_at: undefined });
        }
        continue;
      }

      if (session.last_emptied_at === undefined) {
        // Defensive only: a public session is always created with its
        // first player already seated (`findOrCreatePublicSession`), so it
        // should never reach 0 players without `leaveSession` having
        // stamped this. If it somehow does, start the clock now rather
        // than retiring immediately off a missing timestamp.
        await ctx.db.patch(session._id, { last_emptied_at: now });
        anyStillEmptyAndPending = true;
        continue;
      }

      const emptyFor = now - session.last_emptied_at;

      if (emptyFor >= RETIRE_THRESHOLD_MS) {
        // RETIRE — terminal. Matchmaking mints a genuinely new
        // session_id/room_id next time it needs one; nothing to hand back
        // here. No system message: an empty public lobby has no one in it
        // to read one.
        //
        // F3: also purge any lingering ghost rows (`currentPlayers` here
        // is either already empty — the `leaveSession` path — or entirely
        // disconnected rows, since `connectedPlayers.length === 0` was
        // just established above). Not load-bearing for correctness
        // (`findActivePublicSessionForUser` and the matchmaking search
        // both already exclude `"ended"` sessions), but skipping it would
        // mean ghost `gamePlayers` rows for a genuinely dead session pile
        // up forever with nothing left to ever clean them — the same
        // "unbounded ... accumulating" failure D3 exists to prevent,
        // applied to this table instead of `gameSessions` itself.
        for (const player of currentPlayers) {
          await ctx.db.delete(player._id);
        }
        await ctx.db.patch(session._id, { status: "ended" });
        continue;
      }

      // Still within the grace period — RECYCLE.

      // F3: purge any lingering rows first, regardless of session status.
      // A `leaveSession`-emptied room already has none (each departure
      // deleted its own row) — this is a no-op there. A ghost-emptied room
      // (F3's case) can have rows in ANY status including "waiting" (e.g.
      // the sole player in a room that never reached capacity had their
      // tab crash before ever leaving) — a stale row like that must be
      // cleared even though there's no status/round-state to reset,
      // otherwise the "recycled" room still looks occupied to
      // matchmaking's own `currentPlayers.length` capacity check and to
      // the lobby UI's roster view. Deleting from `currentPlayers` — not
      // re-querying — since it was already collected fresh this same
      // sweep pass, all of connectedPlayers.length === 0 having just been
      // established.
      for (const player of currentPlayers) {
        await ctx.db.delete(player._id);
      }

      // Status/round-state reset only needed if there's actually something
      // to reset — a room still sitting in "waiting" (never filled or
      // started before it emptied) is already exactly what a recycled room
      // should look like once the ghost rows above are cleared.
      if (session.status !== "waiting") {
        const staleRounds = await ctx.db
          .query("gameRounds")
          .withIndex("by_session_id", (q) => q.eq("session_id", session.session_id))
          .collect();
        for (const round of staleRounds) {
          await ctx.db.delete(round._id);
        }
        await ctx.db.patch(session._id, {
          status: "waiting",
          current_round: 0,
          countdown_started_at: undefined,
        });
      }
      anyStillEmptyAndPending = true;
    }

    if (anyStillEmptyAndPending) {
      const jobId = await ctx.scheduler.runAfter(
        CLEANUP_CHECK_INTERVAL_MS,
        internal.gameSessions.sweepEmptyPublicSessions,
        {},
      );
      await ctx.db.insert("gameSessionCleanupScheduler", { jobId });
    }
  },
});
