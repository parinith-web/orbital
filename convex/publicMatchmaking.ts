import { mutation, type MutationCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  DEFAULT_SESSION_CAPACITY,
  generateSessionId,
  seatPlayerInSession,
} from "./gameSessions";
import { maybeStartAutostartCountdown } from "./gameRounds";
import { logGameEvent } from "./gameEvents";
import { PUBLIC_LOBBY_ROOM_ID_PREFIX } from "./games/lobbyConfig";

/**
 * Public-lobby matchmaking — D1.
 *
 * Feature 2's "Join a Game" entry point (Phase E's UI, not yet built) calls
 * `findOrCreatePublicSession` with no arguments: find an existing public
 * room still in its `"waiting"` phase with an open seat, or spin up a
 * fresh one and seat the caller as its first member — the same
 * find-open-room-or-create-one pattern the PRD names Skribbl.io as
 * precedent for.
 *
 * SCOPE: this file owns *public*-mode session creation and matchmaking
 * only. Private/in-room session creation (`createSession`) and the
 * mode-agnostic player-roster CRUD (`joinSession` / `leaveSession` /
 * `seatPlayerInSession`) stay in `gameSessions.ts` — this file is a thin
 * caller of that CRUD, not a second implementation of it. Round mechanics
 * (`gameRounds.ts`) don't care which mode a session is either, so nothing
 * there needs to change for public sessions to start playing once seated.
 *
 * WHAT D1 DELIBERATELY DOES NOT DO (left for D2/D3 per the plan):
 * - [D2a landed] Lock-on-full is no longer this file's gap — as of D2a,
 *   `seatPlayerInSession` (in `gameSessions.ts`) itself flips a session's
 *   `status` to `"locked"` in the same transaction as whichever seat call
 *   fills it to `capacity`, so both the "found an existing room" seat
 *   below and the "just created a new room" seat pick this up for free
 *   with no changes needed here. [D2b landed] Lock-on-*start* (a public
 *   session that hasn't hit capacity but has had a round started on it) now
 *   lives in `gameRounds.ts`'s `startRound` too — a public session promotes
 *   straight from `"waiting"` to `"locked"` there instead of the
 *   `"in_progress"` a private session gets, so this file's `by_status_mode`
 *   query (which only ever looks at `"waiting"`) stops surfacing a public
 *   room the instant a round starts on it, exactly like it already does
 *   once one fills via D2a. No changes needed in this file for that either
 *   — same reasoning as D2a, this file just consumes `"waiting"` and
 *   doesn't care which of D2a/D2b is what moved a given room off of it.
 * - No explicit multi-mutation race-condition guard for "two joins
 *   landing on the last slot simultaneously" (the PRD's own phrasing for
 *   D2's job). Convex mutations run as isolated, serializable
 *   transactions with optimistic concurrency control: two concurrent
 *   `findOrCreatePublicSession` calls that both read the same session's
 *   `gamePlayers` rows and then both insert into it will have their read
 *   sets invalidated by each other's write, so Convex retries one of them
 *   automatically rather than letting both inserts land and overshoot
 *   capacity. That's a genuine safety property of the platform, not
 *   something this file added — it's noted here so D2 knows what's
 *   already covered "for free" versus what it still needs to add
 *   (the actual `locked` transition, and any *cross-session* dedup for a
 *   user who somehow ends up seated in two different public rooms at
 *   once, which is not handled at all yet).
 * - [F2a landed] Cross-session dedup — see `findActivePublicSessionForUser`
 *   and its use at the top of the handler below. D1's original gap note
 *   (kept here for history): no dedup against a caller already being
 *   seated in some *other* public session (e.g. a stale tab, clicking
 *   "Join a Game" twice in a way both calls land before either seats them,
 *   or a page refresh after the room the caller was already in has since
 *   moved past `"waiting"` — see F2a's own note below for why that last
 *   one is the same underlying bug, not a separate one). D1 also observed
 *   reconnecting into the *same* room a caller's already in (e.g. a
 *   refresh while that room is still `"waiting"`) was already handled —
 *   still true, still goes through `seatPlayerInSession`'s existing-row
 *   branch exactly as before; F2a only changes what happens when the room
 *   they're already in *isn't* the one the `by_status_mode` search below
 *   would have found.
 *
 * WHY NOT JUST `.first()` ON THE INDEX: `by_status_mode` narrows to
 * `("waiting", "public")` sessions but has no opinion on capacity, so the
 * very first match isn't necessarily seatable. Now that D2a's lock-on-full
 * transitions a session out of `"waiting"` the instant it fills, a
 * `"waiting"` result from this index *should* always have an open seat in
 * practice — but this loop is left as-is rather than collapsed to
 * `.first()`: it's cheap defense-in-depth against exactly the kind of
 * stale-invariant risk D1's own notes elsewhere warn about (a second write
 * path quietly invalidating an assumption), and collapsing it is a
 * separate decision from D2a's actual job, not made here.
 */

/** Public-lobby-only default — private sessions have no autostart timer, so this stays out of gameSessions.ts's shared DEFAULT_SESSION_CAPACITY. */
const DEFAULT_MIN_PLAYERS_TO_START = 4;

/**
 * F2a — find a live public session the given user is *already* seated in,
 * if any, using the new `gamePlayers.by_user_id` index (schema.ts).
 *
 * "Live" = mode `"public"` and status anything but `"ended"` —
 * `"waiting"`, `"in_progress"`, and `"locked"` all count, since a caller
 * seated in any of those already has a real seat to return them to;
 * `"ended"` sessions are terminal (D3) and shouldn't be treated as a home
 * to reconnect into. Private/in-room `gamePlayers` rows for this user are
 * ignored entirely — this dedup is scoped to the public matchmaking pool
 * only, matching this file's own SCOPE note above.
 *
 * A user should have at most one such row after this session's fix, but
 * this is defensive about pre-existing double-seated data (from before the
 * fix, or any other future write path this file doesn't control): if more
 * than one turns up, deterministically picks the most recently created
 * `gamePlayers` row (`_creationTime`) rather than an arbitrary index-order
 * pick — the newest seat is the one most likely to reflect where the user
 * actually is right now.
 */
async function findActivePublicSessionForUser(
  ctx: MutationCtx,
  userId: string,
): Promise<Doc<"gameSessions"> | null> {
  const playerRows = await ctx.db
    .query("gamePlayers")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .collect();
  if (playerRows.length === 0) return null;

  const candidates: Array<{ row: Doc<"gamePlayers">; session: Doc<"gameSessions"> }> = [];
  for (const row of playerRows) {
    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_session_id", (q) => q.eq("session_id", row.session_id))
      .first();
    if (session && session.mode === "public" && session.status !== "ended") {
      candidates.push({ row, session });
    }
  }
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.row._creationTime - a.row._creationTime);
  return candidates[0].session;
}

export const findOrCreatePublicSession = mutation({
  // F1b: connection_id is the caller's tab-scoped id (see
  // src/lib/games/connectionId.ts); threaded straight through to
  // seatPlayerInSession so a reconnect via this entry point participates
  // in the same stale-goOffline guard heartbeat-based reconnects get.
  args: { connection_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    // F2a — before searching for/creating anything, check whether this
    // caller already has a live seat in some public session. Covers both
    // named F2 scenarios in one fix: a real double-click firing two calls
    // before either has seated the caller (the second call now finds the
    // first call's seat and returns it instead of seating a second one),
    // and a refresh mid-match landing here again after the caller's actual
    // session has moved past `"waiting"` (previously invisible to the
    // `by_status_mode` search below, so the old code would spin up an
    // unrelated *second* session instead of reconnecting them to the game
    // they're actually in). Routes straight through `seatPlayerInSession`'s
    // existing reconnect branch — same seat-refresh/heartbeat-stamp
    // behavior a same-room refresh already got, just no longer conditional
    // on that room still being `"waiting"`.
    const existingSession = await findActivePublicSessionForUser(ctx, identity.subject);
    if (existingSession) {
      const seat = await seatPlayerInSession(
        ctx,
        existingSession,
        identity.subject,
        args.connection_id,
      );
      if ("error" in seat) return seat;
      const reseated = await ctx.db.get(existingSession._id);
      if (reseated) await maybeStartAutostartCountdown(ctx, reseated);
      // G1 — "Join a Game" click, logged post-seat so it only fires once
      // the caller actually has a seat, not on an error return above.
      // Fires on this reconnect branch too (not just a brand-new seat) —
      // a refresh mid-match is still a real "click to join" moment for the
      // latency metric this feeds, per gameEvents.ts's own #2 doc comment.
      await logGameEvent(ctx, {
        event_type: "public_join_requested",
        session: {
          session_id: existingSession.session_id,
          room_id: existingSession.room_id,
          mode: "public",
        },
        user_id: identity.subject,
        metadata: { reconnected: seat.reconnected },
      });
      return { session_id: existingSession.session_id, created: false as const, ...seat };
    }

    const waitingPublicSessions = await ctx.db
      .query("gameSessions")
      .withIndex("by_status_mode", (q) =>
        q.eq("status", "waiting").eq("mode", "public"),
      )
      .collect();

    for (const candidate of waitingPublicSessions) {
      const currentPlayers = await ctx.db
        .query("gamePlayers")
        .withIndex("by_session_id", (q) => q.eq("session_id", candidate.session_id))
        .collect();
      if (currentPlayers.length >= candidate.capacity) continue;

      const seat = await seatPlayerInSession(ctx, candidate, identity.subject, args.connection_id);
      if ("error" in seat) return seat;

      // E2: re-read the row rather than reusing `candidate` — seating may
      // have just locked it (D2a, hitting capacity), and the countdown
      // needs to see that fresh status/roster, not the pre-seat snapshot.
      const seatedSession = await ctx.db.get(candidate._id);
      if (seatedSession) await maybeStartAutostartCountdown(ctx, seatedSession);

      // G1 — see the reconnect branch above for why this logs post-seat
      // and includes the reconnect flag.
      await logGameEvent(ctx, {
        event_type: "public_join_requested",
        session: { session_id: candidate.session_id, room_id: candidate.room_id, mode: "public" },
        user_id: identity.subject,
        metadata: { reconnected: seat.reconnected },
      });

      return { session_id: candidate.session_id, created: false as const, ...seat };
    }

    // No open room found — spin up a new one and seat the caller as its
    // first member. `room_id` is synthetic (no real Orbital `rooms` row
    // behind it, unlike private sessions) — it exists purely so this
    // session's system messages (gameRounds.ts's postSystemMessage) have
    // somewhere to post into, via the same `messages` conversation_id
    // convention private sessions already use. Phase E's public-lobby UI
    // is expected to read that same conversation_id for its own chat view.
    const session_id = generateSessionId();
    const room_id = generateSessionId(PUBLIC_LOBBY_ROOM_ID_PREFIX);

    const newSessionDocId = await ctx.db.insert("gameSessions", {
      session_id,
      room_id,
      mode: "public",
      status: "waiting",
      capacity: DEFAULT_SESSION_CAPACITY,
      min_players_to_start: DEFAULT_MIN_PLAYERS_TO_START,
      current_round: 0,
      created_at: Date.now(),
    });

    const newSession = await ctx.db.get(newSessionDocId);
    if (!newSession) return { error: "Failed to create a public session" };

    const seat = await seatPlayerInSession(ctx, newSession, identity.subject, args.connection_id);
    if ("error" in seat) return seat;

    // E2: virtually always a no-op here (a fresh room's first seat is 1
    // player, well under the default min_players_to_start of 4), but kept
    // for the same reason D1's own loop-vs-.first() note above stays
    // defensive — cheap, and correct if either default is ever retuned.
    const seatedSession = await ctx.db.get(newSessionDocId);
    if (seatedSession) await maybeStartAutostartCountdown(ctx, seatedSession);

    // G1 — two events here, not one: a public `session_created` (this
    // room's own first-ever existence, mirroring `createSession`'s private
    // logging) AND a `public_join_requested` for the caller who triggered
    // it (same as the other two branches above — this caller's own "click"
    // is just as real when it's the click that spins up the room as when
    // it finds an existing one).
    await logGameEvent(ctx, {
      event_type: "session_created",
      session: { session_id, room_id, mode: "public" },
      user_id: identity.subject,
    });
    await logGameEvent(ctx, {
      event_type: "public_join_requested",
      session: { session_id, room_id, mode: "public" },
      user_id: identity.subject,
      metadata: { reconnected: seat.reconnected },
    });

    return { session_id, created: true as const, ...seat };
  },
});
