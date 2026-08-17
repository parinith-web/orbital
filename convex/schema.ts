import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    user_id: v.string(),
    username: v.string(),
    avatar: v.optional(v.string()),
    email: v.optional(v.string()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_username", ["username"]),

  rooms: defineTable({
    room_id: v.string(),
    room_name: v.string(),
    is_group: v.boolean(),
  }).index("by_room_id", ["room_id"]),

  roomMembers: defineTable({
    room_id: v.string(),
    user_id: v.string(),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    role: v.optional(v.string()),
    notificationPreference: v.optional(v.string()),
  })
    .index("by_room_id", ["room_id"])
    .index("by_user_id", ["user_id"])
    .index("by_user_room", ["user_id", "room_id"]),

  messages: defineTable({
    conversation_id: v.string(),
    conversation_type: v.union(v.literal("room"), v.literal("direct")),
    sender_id: v.string(),
    sender_username: v.optional(v.string()),
    sender_avatar: v.optional(v.string()),
    content: v.union(v.string(), v.null()),
    file_storage_id: v.optional(v.id("_storage")),
    file_url: v.union(v.string(), v.null()),
    type: v.union(v.string(), v.null()),
    file_name: v.union(v.string(), v.null()),
    file_size: v.optional(v.number()),
    edited: v.optional(v.boolean()),
    mentions: v.optional(v.array(v.string())),
  })
    .index("by_conversation", ["conversation_id"])
    .searchIndex("search_content", {
      searchField: "content",
      filterFields: ["conversation_id"],
    }),

  chatNotifications: defineTable({
    user_id: v.string(),
    message_id: v.string(),
    source_type: v.union(v.literal("room"), v.literal("direct")),
    source_id: v.string(),
    conversation_id: v.optional(v.string()),
    source_name: v.string(),
    sender_id: v.string(),
    sender_name: v.string(),
    sender_avatar: v.optional(v.string()),
    message: v.string(),
    notification_type: v.optional(
      v.union(v.literal("message"), v.literal("call")),
    ),
    call_id: v.optional(v.id("calls")),
    call_status: v.optional(v.union(v.literal("active"), v.literal("ended"))),
    read_at: v.optional(v.number()),
    hasMentions: v.optional(v.boolean()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_message_id", ["message_id"])
    .index("by_call_id", ["call_id"])
    .index("by_user_conversation", ["user_id", "conversation_id"]),

  unreadCounters: defineTable({
    user_id: v.string(),
    conversation_id: v.string(),
    source_type: v.union(v.literal("room"), v.literal("direct")),
    source_id: v.string(),
    unread_count: v.number(),
    updated_at: v.number(),
    has_unread_mentions: v.optional(v.boolean()),
  })
    .index("by_user_id", ["user_id"])
    .index("by_user_conversation", ["user_id", "conversation_id"]),

  // Friends: two users' relationship (pending or accepted request), keyed
  // by the pair in canonical order (user_id_a < user_id_b as plain string
  // comparison) so a relationship has exactly one row regardless of which
  // user initiated it or which one a caller has "in hand." That
  // canonicalization is an application-level invariant enforced by every
  // mutation that writes these rows (see `canonicalPair` in
  // convex/lib/friends.ts) — Convex has no schema-level uniqueness/check
  // constraint to lean on here, so `by_pair` only pays off if every writer
  // respects the ordering.
  friends: defineTable({
    user_id_a: v.string(), // canonically the lexicographically smaller user_id
    user_id_b: v.string(), // canonically the lexicographically larger user_id
    status: v.union(v.literal("pending"), v.literal("accepted")),
    requested_by: v.string(), // which of user_id_a/user_id_b sent the request;
      // lets listPendingRequests (Session 5) distinguish "incoming" from
      // "outgoing" for a given viewer without a separate direction field
    created_at: v.number(),
    responded_at: v.optional(v.number()), // set when status flips to "accepted";
      // absent for still-pending rows
  })
    // Canonical-pair lookup: "are these two users already related, and
    // what's the status" in one indexed point lookup, given the pair
    // already sorted into (user_id_a, user_id_b) order.
    .index("by_pair", ["user_id_a", "user_id_b"])
    // A user can land on either side of the canonical pair depending on
    // how their id compares to the other user's, so listing "my
    // relationships" needs both sides queried and merged by the caller
    // (Session 5) rather than a single index — same two-sided shape as
    // this table's `conversations` sibling below.
    .index("by_user_id_a", ["user_id_a"])
    .index("by_user_id_b", ["user_id_b"]),

  // Session 4 — one row per accepted friendship's DM thread. Only created
  // once the matching `friends` row reaches `"accepted"` (Session 5's
  // respondToFriendRequest is responsible for that transition; this table
  // makes no attempt to enforce it itself). `messages.conversation_id` for
  // these threads is expected to be a deterministic string derived from
  // the same canonical (user_id_a, user_id_b) pair — Session 5's concern,
  // not this schema.
  conversations: defineTable({
    user_id_a: v.string(), // canonically the lexicographically smaller user_id
    user_id_b: v.string(), // canonically the lexicographically larger user_id
    last_message_preview: v.optional(v.string()),
    last_message_at: v.optional(v.number()),
  })
    .index("by_pair", ["user_id_a", "user_id_b"])
    .index("by_user_id_a", ["user_id_a"])
    .index("by_user_id_b", ["user_id_b"]),

  presence: defineTable({
    user_id: v.string(),
    status: v.union(v.literal("online"), v.literal("away")),
    updated_at: v.number(),
  }).index("by_user_id", ["user_id"])
    .index("by_updated_at", ["updated_at"]),

  presenceCleanupScheduler: defineTable({
    jobId: v.id("_scheduled_functions"),
  }),

  gameSessionCleanupScheduler: defineTable({
    jobId: v.id("_scheduled_functions"),
  }),

  // F1a: singleton tracker for the game-presence staleness sweep, same
  // shape/reasoning as the two schedulers above — its own row rather than
  // reusing either of them, since it runs on a different cadence (10s, not
  // 1min/5min) and scans a different table.
  gamePresenceCleanupScheduler: defineTable({
    jobId: v.id("_scheduled_functions"),
  }),

  typingIndicators: defineTable({
    room_id: v.string(),
    user_id: v.string(),
    updated_at: v.number(),
  })
    .index("by_room_id", ["room_id"])
    .index("by_user_id", ["user_id"])
    .index("by_user_room", ["user_id", "room_id"]),

  reactions: defineTable({
    message_id: v.id("messages"),
    user_id: v.string(),
    emoji: v.string(),
  }).index("by_message_id", ["message_id"]),

  calls: defineTable({
    roomId: v.string(),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    participants: v.array(v.string()),
    allParticipants: v.array(v.string()),
    activePeerIds: v.optional(
      v.array(
        v.object({
          userId: v.string(),
          peerId: v.string(),
        }),
      ),
    ),
    mediaStates: v.optional(
      v.array(
        v.object({
          userId: v.string(),
          isMuted: v.boolean(),
          isVideoOn: v.boolean(),
          isScreenSharing: v.optional(v.boolean()),
        }),
      ),
    ),
    initiatorId: v.string(),
    isActive: v.boolean(),
  })
    .index("by_room_id", ["roomId"])
    .index("by_active", ["roomId", "isActive"])
    .index("by_status", ["isActive"]),

  gameSessions: defineTable({
    session_id: v.string(),
    room_id: v.string(), // links to an existing Orbital room_id (private mode)
                          // or a generated public-lobby room_id (public mode)
    mode: v.union(v.literal("private"), v.literal("public")),
    status: v.union(
      v.literal("waiting"), // open for joins
      v.literal("in_progress"),
      v.literal("locked"), // full or started, not accepting joiners
      v.literal("ended"),
    ),
    capacity: v.number(), // default 10 for public rooms
    min_players_to_start: v.optional(v.number()), // default 4 for public rooms
    countdown_started_at: v.optional(v.number()), // set once min_players reached
    current_round: v.number(),
    created_at: v.number(),
    last_emptied_at: v.optional(v.number()), // set when player count hits 0;
                                               // drives recycle-vs-retire policy
    // H5 — room-code backend for game rooms. All three are optional
    // because they only apply to sessions minted via `gameRoomCode.ts`'s
    // `createGameRoom` — `createSession` (an existing Orbital room's
    // in-room "Play Anomaly") and `publicMatchmaking`'s
    // `findOrCreatePublicSession` never set any of these, same as they
    // never set each other's mode-specific fields
    // (`min_players_to_start`/`countdown_started_at` are public-only,
    // symmetrically).
    host_user_id: v.optional(v.string()), // the user who ran `createGameRoom`;
      // distinct from "any current room member" — used for H8's host-only
      // controls (end game, etc.), which a plain roomMembers `role` lookup
      // doesn't cleanly answer once a room is game-first rather than a
      // persistent chat room with an "owner".
    join_code: v.optional(v.string()), // short shareable code (see
      // gameRoomCode.ts's JOIN_CODE_LENGTH/JOIN_CODE_ALPHABET) a second
      // player types into `joinGameRoomByCode` to be seated. Always
      // uppercase-normalized at write time so lookups are a plain
      // case-sensitive index match.
    game_type: v.optional(v.string()), // "anomaly" today; a plain string
      // rather than a literal union so H6's hub can add a second game
      // tile later without a schema migration — this table has no
      // validation opinion on which `game_type` values are "real," that
      // lives in the hub UI / whichever mutation reads it.
  })
    .index("by_room_id", ["room_id"])
    .index("by_status_mode", ["status", "mode"])
    .index("by_session_id", ["session_id"])
    .index("by_join_code", ["join_code"]),

  gamePlayers: defineTable({
    session_id: v.string(),
    user_id: v.string(),
    username: v.optional(v.string()),
    avatar: v.optional(v.string()),
    score: v.number(),
    // Number of rounds this player has been dealt the off-signal role in
    // this session, incremented once by `beginRound` (gameRounds.ts) each
    // time they're picked. Purely an informational per-player stat —
    // surfaced on the leaderboard (H3) as supporting context — and NOT
    // used to influence which player gets picked next: imposter selection
    // (`wordAssignment.ts`'s `pickOffSignalPlayer`) is a plain
    // uniform-random draw from the connected roster every round.
    // Undefined/missing counts as 0, same convention as `is_off_signal`/
    // `connected` below.
    offsignal_count: v.optional(v.number()),
    is_off_signal: v.optional(v.boolean()), // per-round, reset each round
    connected: v.optional(v.boolean()), // false while disconnected mid-round
    last_heartbeat_at: v.optional(v.number()), // F1a: last gamePresence.heartbeat
                                                 // (or seat/reconnect) timestamp;
                                                 // drives markStaleDisconnected
    active_connection_id: v.optional(v.string()), // F1b: tab-scoped id of
      // whichever client currently "owns" this player's connected state.
      // Written by heartbeat and by seatPlayerInSession's reconnect branch;
      // checked by goOffline so a stale beforeunload/pagehide signal from a
      // tab that's already been superseded by a fresher connection can't
      // clobber it back to disconnected. See gamePresence.ts's header.
  })
    .index("by_session_id", ["session_id"])
    .index("by_user_session", ["user_id", "session_id"])
    // F1a: lets the staleness sweep find only currently-`connected: true`
    // rows whose heartbeat is older than its cutoff, without a full-table
    // scan — mirrors presence.ts's own `by_updated_at` index for the same
    // reason.
    .index("by_connected_heartbeat", ["connected", "last_heartbeat_at"])
    // F2a: `by_user_session` needs a specific session_id already in hand,
    // so it can't answer "which session(s), if any, is this user currently
    // seated in" — exactly the question `findOrCreatePublicSession` needs
    // to ask *before* matchmaking, to dedup a double-click join / a
    // refresh-mid-match landing the same user in a second session. See
    // `publicMatchmaking.ts`'s `findActivePublicSessionForUser`.
    .index("by_user_id", ["user_id"]),

  gameRounds: defineTable({
    session_id: v.string(),
    round_number: v.number(),
    word_main: v.string(),
    word_offsignal: v.string(),
    offsignal_user_id: v.string(),
    speaking_order: v.array(v.string()),
    current_speaker_index: v.optional(v.number()),
    turn_expires_at: v.optional(v.number()), // server-authoritative timer deadline
    votes: v.array(v.object({ voter_id: v.string(), voted_for_id: v.string() })),
    status: v.union(
      v.literal("speaking"),
      v.literal("voting"),
      v.literal("revealed"),
    ),
  }).index("by_session_id", ["session_id"]),

  // G1 — raw event log feeding the PRD's §8 Success Metrics. See
  // convex/gameEvents.ts's file header for the full per-metric mapping;
  // this table only needs to hold enough to reconstruct each metric later,
  // not compute any of them itself.
  gameEvents: defineTable({
    event_type: v.union(
      v.literal("session_created"), // a gameSessions row was just inserted (private or public)
      v.literal("public_join_requested"), // findOrCreatePublicSession seated someone (fresh or reconnect)
      v.literal("round_started"), // beginRound landed a round, either mode, manual or autostart
      v.literal("player_left_public_session"), // leaveSession on a public-mode session
      // H2 — a player's cumulative score crossed WINNING_SCORE right after
      // a reveal; performReveal flips the session to "ended" and logs this
      // in the same breath. `user_id` is the winner (or the first player
      // found over the line, if a round's score deltas push more than one
      // player past it simultaneously); `metadata` carries their final
      // score. See gameRounds.ts's performReveal for the actual check.
      v.literal("session_ended"),
      // H8 — a fresh gameSessions row replaced an ended one in the same
      // room via gameSessions.ts's rematchSession. metadata carries
      // {"previous_session_id": <the ended session's session_id>}. See
      // gameEvents.ts's own GameEventType comment for why this is a
      // distinct type from "session_created" rather than reusing it.
      v.literal("session_rematched"),
    ),
    session_id: v.string(),
    room_id: v.string(),
    mode: v.union(v.literal("private"), v.literal("public")),
    user_id: v.optional(v.string()), // absent for system-triggered events (autostart job)
    round_number: v.optional(v.number()),
    // Small stringified-JSON bag for event-specific extras that don't
    // warrant their own column (e.g. round_started's trigger, or
    // player_left_public_session's reconnected flag) — kept optional and
    // deliberately loose rather than growing this table's own column list
    // every time a downstream metrics query wants one more crumb of context.
    metadata: v.optional(v.string()),
    created_at: v.number(),
  })
    .index("by_session_id", ["session_id"])
    .index("by_event_type_created_at", ["event_type", "created_at"])
    .index("by_room_id", ["room_id"]),
});
