import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import { canonicalPair, directConversationId } from "./lib/friends";

const SEARCH_RESULTS_LIMIT = 20;

async function getUserByExternalId(ctx: QueryCtx | MutationCtx, userId: string) {
  return ctx.db
    .query("users")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .first();
}

async function requireIdentity(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated");
  return identity;
}

function toProfileSummary(user: Doc<"users"> | null, fallbackUserId: string) {
  return {
    user_id: fallbackUserId,
    username: user?.username || "Unknown",
    avatar: user?.avatar,
  };
}

/**
 * Fetches the `friends` row (if any) for a pair, given already-canonical
 * (user_id_a, user_id_b) order. Internal helper — `by_pair` only pays off
 * if callers always pass the pair pre-sorted, which every exported
 * function below does via canonicalPair before calling this.
 */
async function getFriendsRowByCanonicalPair(
  ctx: QueryCtx | MutationCtx,
  userIdA: string,
  userIdB: string,
) {
  return ctx.db
    .query("friends")
    .withIndex("by_pair", (q) => q.eq("user_id_a", userIdA).eq("user_id_b", userIdB))
    .first();
}

// ─── Search ─────────────────────────────────────────────────────────────

/**
 * Username search, excluding the caller. `users` only has an exact-match
 * index on username (`by_username`), so this does a full scan + substring
 * filter rather than a prefix/fuzzy search index — fine at this app's
 * scale, and avoids a schema change in a session that's meant to be
 * schema-free (Session 4 owns the schema).
 */
export const searchUsers = query({
  args: { search_query: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const trimmed = args.search_query.trim();
    if (!trimmed) return [];

    const needle = trimmed.toLowerCase();
    const allUsers = await ctx.db.query("users").collect();

    return allUsers
      .filter(
        (user) =>
          user.user_id !== identity.subject &&
          user.username.toLowerCase().includes(needle),
      )
      .slice(0, SEARCH_RESULTS_LIMIT)
      .map((user) => ({
        user_id: user.user_id,
        username: user.username,
        avatar: user.avatar,
      }));
  },
});

// ─── Requests ───────────────────────────────────────────────────────────

export const sendFriendRequest = mutation({
  args: { to_user_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const fromUserId = identity.subject;

    if (args.to_user_id === fromUserId) {
      return { error: "You can't send yourself a friend request" };
    }

    const targetUser = await getUserByExternalId(ctx, args.to_user_id);
    if (!targetUser) {
      return { error: "User not found" };
    }

    const [userIdA, userIdB] = canonicalPair(fromUserId, args.to_user_id);
    const existing = await getFriendsRowByCanonicalPair(ctx, userIdA, userIdB);

    if (existing) {
      if (existing.status === "accepted") {
        return { error: "You're already friends" };
      }
      // status === "pending"
      if (existing.requested_by === fromUserId) {
        return { error: "Request already sent" };
      }
      // The other user already requested us — treat calling
      // sendFriendRequest back as accepting theirs rather than leaving
      // both sides stuck with two one-directional pending rows.
      return acceptFriendsRow(ctx, existing);
    }

    await ctx.db.insert("friends", {
      user_id_a: userIdA,
      user_id_b: userIdB,
      status: "pending",
      requested_by: fromUserId,
      created_at: Date.now(),
    });

    return { success: true, status: "pending" as const };
  },
});

/**
 * Shared accept path used both by respondToFriendRequest and by
 * sendFriendRequest's mutual-request auto-accept above. Flips the row to
 * accepted and ensures the matching conversations row exists.
 */
async function acceptFriendsRow(ctx: MutationCtx, friendsRow: Doc<"friends">) {
  await ctx.db.patch(friendsRow._id, {
    status: "accepted",
    responded_at: Date.now(),
  });

  const existingConversation = await ctx.db
    .query("conversations")
    .withIndex("by_pair", (q) =>
      q.eq("user_id_a", friendsRow.user_id_a).eq("user_id_b", friendsRow.user_id_b),
    )
    .first();

  if (!existingConversation) {
    await ctx.db.insert("conversations", {
      user_id_a: friendsRow.user_id_a,
      user_id_b: friendsRow.user_id_b,
    });
  }

  return { success: true, status: "accepted" as const };
}

export const respondToFriendRequest = mutation({
  args: { request_id: v.id("friends"), accept: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const friendsRow = await ctx.db.get(args.request_id);
    if (!friendsRow) return { error: "Request not found" };

    const isParticipant =
      friendsRow.user_id_a === identity.subject ||
      friendsRow.user_id_b === identity.subject;
    if (!isParticipant) return { error: "Unauthorized" };

    if (friendsRow.status !== "pending") {
      return { error: "Request is no longer pending" };
    }

    // Only the recipient can accept/decline — the sender responding to
    // their own request doesn't make sense.
    if (friendsRow.requested_by === identity.subject) {
      return { error: "You can't respond to your own request" };
    }

    if (!args.accept) {
      await ctx.db.delete(friendsRow._id);
      return { success: true, status: "declined" as const };
    }

    return acceptFriendsRow(ctx, friendsRow);
  },
});

export const removeFriend = mutation({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);

    const [userIdA, userIdB] = canonicalPair(identity.subject, args.user_id);
    const friendsRow = await getFriendsRowByCanonicalPair(ctx, userIdA, userIdB);

    if (!friendsRow || friendsRow.status !== "accepted") {
      return { error: "You're not friends with this user" };
    }

    await ctx.db.delete(friendsRow._id);

    // Drop the conversation record too — message history is left in place
    // (same as leaving/deleting a room doesn't purge `messages`), just no
    // longer surfaced as an active thread. sendMessage's accepted-only
    // guard means neither side can add to it going forward anyway.
    const conversation = await ctx.db
      .query("conversations")
      .withIndex("by_pair", (q) => q.eq("user_id_a", userIdA).eq("user_id_b", userIdB))
      .first();
    if (conversation) {
      await ctx.db.delete(conversation._id);
    }

    return { success: true };
  },
});

// ─── Listing ────────────────────────────────────────────────────────────

/**
 * A user can land on either side of a canonical pair, so "my rows" needs
 * both indexes queried and merged — same two-sided shape schema.ts's
 * comments called out for this table.
 */
async function listFriendsRowsForUser(ctx: QueryCtx, userId: string) {
  const [asA, asB] = await Promise.all([
    ctx.db
      .query("friends")
      .withIndex("by_user_id_a", (q) => q.eq("user_id_a", userId))
      .collect(),
    ctx.db
      .query("friends")
      .withIndex("by_user_id_b", (q) => q.eq("user_id_b", userId))
      .collect(),
  ]);
  return [...asA, ...asB];
}

export const listFriends = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const rows = await listFriendsRowsForUser(ctx, identity.subject);

    const accepted = rows.filter((row) => row.status === "accepted");

    return Promise.all(
      accepted.map(async (row) => {
        const otherUserId =
          row.user_id_a === identity.subject ? row.user_id_b : row.user_id_a;
        const otherUser = await getUserByExternalId(ctx, otherUserId);
        return {
          friend: toProfileSummary(otherUser, otherUserId),
          since: row.responded_at ?? row.created_at,
        };
      }),
    );
  },
});

export const listPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const rows = await listFriendsRowsForUser(ctx, identity.subject);
    const pending = rows.filter((row) => row.status === "pending");

    const enriched = await Promise.all(
      pending.map(async (row) => {
        const otherUserId =
          row.user_id_a === identity.subject ? row.user_id_b : row.user_id_a;
        const otherUser = await getUserByExternalId(ctx, otherUserId);
        return {
          request_id: row._id,
          user: toProfileSummary(otherUser, otherUserId),
          created_at: row.created_at,
          direction: (row.requested_by === identity.subject
            ? "outgoing"
            : "incoming") as "incoming" | "outgoing",
        };
      }),
    );

    return {
      incoming: enriched.filter((r) => r.direction === "incoming"),
      outgoing: enriched.filter((r) => r.direction === "outgoing"),
    };
  },
});

/**
 * A user can land on either side of a canonical pair here too — same
 * both-indexes-merged shape as listFriendsRowsForUser above.
 */
async function listConversationRowsForUser(ctx: QueryCtx, userId: string) {
  const [asA, asB] = await Promise.all([
    ctx.db
      .query("conversations")
      .withIndex("by_user_id_a", (q) => q.eq("user_id_a", userId))
      .collect(),
    ctx.db
      .query("conversations")
      .withIndex("by_user_id_b", (q) => q.eq("user_id_b", userId))
      .collect(),
  ]);
  return [...asA, ...asB];
}

export const listMyConversations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const conversations = await listConversationRowsForUser(ctx, identity.subject);

    const enriched = await Promise.all(
      conversations.map(async (conversation) => {
        // Defense in depth: only surface a thread if the underlying
        // friendship is still "accepted" (e.g. a removeFriend race that
        // hasn't caught up to deleting the conversation row yet).
        const friendsRow = await getFriendsRowByCanonicalPair(
          ctx,
          conversation.user_id_a,
          conversation.user_id_b,
        );
        if (!friendsRow || friendsRow.status !== "accepted") return null;

        const otherUserId =
          conversation.user_id_a === identity.subject
            ? conversation.user_id_b
            : conversation.user_id_a;
        const otherUser = await getUserByExternalId(ctx, otherUserId);

        return {
          conversation_id: directConversationId(
            conversation.user_id_a,
            conversation.user_id_b,
          ),
          other_user: toProfileSummary(otherUser, otherUserId),
          last_message_preview: conversation.last_message_preview ?? null,
          last_message_at: conversation.last_message_at ?? conversation._creationTime,
        };
      }),
    );

    return enriched
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.last_message_at - a.last_message_at);
  },
});
