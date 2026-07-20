import { mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import {
  DEFAULT_SESSION_CAPACITY,
  generateSessionId,
  seatPlayerInSession,
} from "./gameSessions";
import { postSystemMessage } from "./gameRounds";
import { logGameEvent } from "./gameEvents";
import { JOIN_CODE_ALPHABET, JOIN_CODE_LENGTH } from "./games/lobbyConfig";

/**
 * H5 — room-code backend for game rooms.
 *
 * SCOPE: this is the third way a player ends up seated in a Signal
 * session, alongside `gameSessions.ts`'s `createSession`/`joinSession`
 * (an *existing* Portal room's roster auto-enrolling into a session) and
 * `publicMatchmaking.ts`'s `findOrCreatePublicSession` ("Play Online",
 * no code, no host). This file covers "Create Room" / "Join Room" from
 * the game hub (H6): a host with no pre-existing Portal room spins one up
 * purely to play a game, gets a short code back, and shares it out of
 * band (voice call, text, whatever) for a second player to type into
 * "Join Room."
 *
 * Deliberately NOT folded into `createSession`/`joinSession`: those two
 * assume a `rooms` row and `roomMembers` roster already exist and are
 * scoped by *current room membership* — exactly backwards from this
 * flow, where the room doesn't exist yet (`createGameRoom`) or the
 * joiner isn't a member yet and the join_code itself is the only
 * credential (`joinGameRoomByCode`). Both still bottom out in the same
 * `seatPlayerInSession` helper as every other join path, so player-roster
 * CRUD (reconnect, lock-on-full, capacity) isn't reimplemented a third
 * time here.
 *
 * MODE: sessions minted here are `mode: "private"`, same as
 * `createSession` — there's a real backing `rooms`/`roomMembers` row
 * (the code is just how a second player finds it), unlike public
 * matchmaking's synthetic `room_id`. H2's win condition and H3's
 * leaderboard already apply uniformly to `private` sessions, so nothing
 * about "first to 10" or the leaderboard needed to change for this mode
 * of getting into a private session.
 */

/**
 * Generates a `JOIN_CODE_LENGTH`-character code from `JOIN_CODE_ALPHABET`.
 * Not itself guaranteed unique — `createGameRoom` below is responsible for
 * checking the result against currently-live sessions and retrying.
 */
function randomJoinCode(): string {
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i++) {
    code += JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
  }
  return code;
}

/**
 * Draws join codes until one isn't currently in use by a *live* session
 * (any status other than `"ended"` — an ended session's code is free to
 * reissue, same reasoning `getSessionByRoomId` already applies to
 * `room_id`). Capped at a handful of attempts: at 6 chars over a
 * 32-symbol alphabet, a collision against the live set (which in
 * practice is nowhere near the full keyspace) is already rare, so a
 * handful of retries is defense-in-depth, not an expected hot path.
 */
async function generateUniqueJoinCode(ctx: MutationCtx): Promise<string> {
  const MAX_ATTEMPTS = 10;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = randomJoinCode();
    const existing = await ctx.db
      .query("gameSessions")
      .withIndex("by_join_code", (q) => q.eq("join_code", candidate))
      .filter((q) => q.neq(q.field("status"), "ended"))
      .first();
    if (!existing) return candidate;
  }
  // Astronomically unlikely to be reached (see MAX_ATTEMPTS's note above),
  // but fail loudly rather than silently handing out a colliding code.
  throw new Error("Could not generate a unique room code, please try again");
}

async function getUserSummary(ctx: MutationCtx, userId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .first();
  return { username: user?.username, avatar: user?.avatar };
}

/**
 * Host creates a fresh game room: a backing `rooms`/`roomMembers` row (so
 * H7's chat/call panel has a `conversation_id` and roster to work with,
 * same convention private in-room sessions already use), a `gameSessions`
 * row carrying the new `host_user_id`/`join_code`/`game_type` fields, and
 * the host seated as its first `gamePlayers` row.
 *
 * Returns the `join_code` — the thing the host actually shares — alongside
 * `session_id`/`room_id` so the caller can route straight into the new
 * game room without a second round-trip.
 */
export const createGameRoom = mutation({
  args: {
    game_type: v.optional(v.string()), // defaults to "signal" — the only
      // game that exists today; kept optional/string (not required) so
      // this mutation doesn't need to change shape the day a second game
      // is added.
    capacity: v.optional(v.number()),
    room_name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const summary = await getUserSummary(ctx, identity.subject);
    const game_type = args.game_type ?? "signal";

    const room_id = generateSessionId("room");
    await ctx.db.insert("rooms", {
      room_id,
      room_name: args.room_name ?? `${summary.username ?? "New"}'s Game Room`,
      is_group: true,
    });
    await ctx.db.insert("roomMembers", {
      room_id,
      user_id: identity.subject,
      username: summary.username,
      avatar: summary.avatar,
      role: "owner",
    });

    const join_code = await generateUniqueJoinCode(ctx);
    const session_id = generateSessionId();
    const capacity = args.capacity ?? DEFAULT_SESSION_CAPACITY;

    await ctx.db.insert("gameSessions", {
      session_id,
      room_id,
      mode: "private",
      status: "waiting",
      capacity,
      current_round: 0,
      created_at: Date.now(),
      host_user_id: identity.subject,
      join_code,
      game_type,
    });

    // Host is seated directly here (not via seatPlayerInSession) — the
    // session was just minted above with zero `gamePlayers` rows, so
    // there's no existing/locked/capacity state for that helper's checks
    // to meaningfully guard against for this very first seat; mirrors
    // `createSession`'s own direct-insert for the same reason.
    await ctx.db.insert("gamePlayers", {
      session_id,
      user_id: identity.subject,
      username: summary.username,
      avatar: summary.avatar,
      score: 0,
      connected: true,
      last_heartbeat_at: Date.now(),
    });

    // G1 — same event this file's private-session sibling
    // (`createSession`) already logs, for the same adoption metric; a
    // room-code room is still "a Portal room trying Signal," it just
    // came into existence via this flow instead of an existing chat room.
    await logGameEvent(ctx, {
      event_type: "session_created",
      session: { session_id, room_id, mode: "private" },
      user_id: identity.subject,
    });

    return { session_id, room_id, join_code };
  },
});

/**
 * Second player enters a code, gets seated into the matching room — and,
 * unlike `joinSession`'s private-mode branch (which requires *existing*
 * `roomMembers` membership as its gate), becomes a member right here,
 * since the whole point of a join code is letting someone in who wasn't
 * a member yet. Code matching is case-insensitive (normalized to
 * uppercase on both write and read); surrounding whitespace from a
 * copy-paste is trimmed.
 */
export const joinGameRoomByCode = mutation({
  args: { join_code: v.string(), connection_id: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const normalizedCode = args.join_code.trim().toUpperCase();
    if (normalizedCode.length === 0) return { error: "Enter a room code" };

    const session = await ctx.db
      .query("gameSessions")
      .withIndex("by_join_code", (q) => q.eq("join_code", normalizedCode))
      .filter((q) => q.neq(q.field("status"), "ended"))
      .first();
    if (!session) return { error: "Invalid or expired room code" };

    const summary = await getUserSummary(ctx, identity.subject);
    const existingMembership = await ctx.db
      .query("roomMembers")
      .withIndex("by_user_room", (q) =>
        q.eq("user_id", identity.subject).eq("room_id", session.room_id),
      )
      .first();

    if (!existingMembership) {
      await ctx.db.insert("roomMembers", {
        room_id: session.room_id,
        user_id: identity.subject,
        username: summary.username,
        avatar: summary.avatar,
        role: "member",
      });
    }

    const seat = await seatPlayerInSession(ctx, session, identity.subject, args.connection_id);
    if ("error" in seat) return seat;

    // Only announce a genuinely new arrival, not a reconnect — a
    // returning player's own client already knows they're back;
    // `postSystemMessage` here mirrors `rooms.ts`'s `joinRoom` system
    // message for the same "someone joined" moment, just phrased for a
    // code-based join and gated on `!existingMembership` (a rejoin via
    // this mutation, e.g. a page refresh, is still a "reconnect" from the
    // roomMembers row's point of view even before `seatPlayerInSession`'s
    // own reconnect check runs).
    if (!existingMembership) {
      await postSystemMessage(
        ctx,
        session,
        `${summary.username ?? "A player"} joined using the room code`,
      );
    }

    return { session_id: session.session_id, room_id: session.room_id, ...seat };
  },
});
