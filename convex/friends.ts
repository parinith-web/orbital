import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { buildDirectConversationId } from "./lib/conversations";

export const getFriends = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const friendships = await ctx.db
      .query("friends")
      .withIndex("by_user_id_status", (q) =>
        q.eq("user_id", identity.subject).eq("status", "accepted"),
      )
      .collect();

    const result = await Promise.all(
      friendships.map(async (f) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_user_id", (q) => q.eq("user_id", f.friend_id))
          .first();

        const username = user?.username || f.friend_username || "Unknown";
        const avatar = user?.avatar || f.friend_avatar;

        const conversationId = buildDirectConversationId(identity.subject, f.friend_id);

        return {
          id: f._id,
          friend: {
            user_id: f.friend_id,
            username,
            avatar,
          },
          last_msg: f.last_msg,
          last_msg_sender: f.last_msg_sender,
          updated_at: f.updated_at,
          _creationTime: f._creationTime,
        };
      })
    );

    return result;
  },
});

export const getPendingRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const requests = await ctx.db
      .query("friends")
      .withIndex("by_friend_id", (q) => q.eq("friend_id", identity.subject))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const result = await Promise.all(
      requests.map(async (r) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_user_id", (q) => q.eq("user_id", r.user_id))
          .first();

        return {
          id: r._id,
          _creationTime: r._creationTime,
          sender: {
            user_id: r.user_id,
            username: user?.username || "Unknown",
            avatar: user?.avatar,
          },
        };
      })
    );

    return result;
  },
});

export const getSentRequests = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const requests = await ctx.db
      .query("friends")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    const result = await Promise.all(
      requests.map(async (r) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_user_id", (q) => q.eq("user_id", r.friend_id))
          .first();

        const username = user?.username || r.friend_username || "Unknown";
        const avatar = user?.avatar || r.friend_avatar;

        return {
          id: r._id,
          _creationTime: r._creationTime,
          receiver: {
            user_id: r.friend_id,
            username,
            avatar,
          },
        };
      })
    );

    return result;
  },
});

export const sendRequest = mutation({
  args: { receiver_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    if (identity.subject === args.receiver_id) {
      return { error: "Cannot add yourself" };
    }

    const receiver = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.receiver_id))
      .first();

    if (!receiver) {
      return { error: "User does not exist" };
    }

    const existing1 = await ctx.db
      .query("friends")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .filter((q) => q.eq(q.field("friend_id"), args.receiver_id))
      .first();

    const existing2 = await ctx.db
      .query("friends")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.receiver_id))
      .filter((q) => q.eq(q.field("friend_id"), identity.subject))
      .first();

    if (existing1 || existing2) {
      return { error: "Friend request already exists or already friends" };
    }

    await ctx.db.insert("friends", {
      user_id: identity.subject,
      friend_id: args.receiver_id,
      friend_username: receiver.username,
      friend_avatar: receiver.avatar,
      status: "pending",
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const acceptRequest = mutation({
  args: { requestId: v.id("friends") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) return { error: "Request not found" };
    if (request.friend_id !== identity.subject) return { error: "Unauthorized" };

    const sender = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", request.user_id))
      .first();

    await ctx.db.patch(args.requestId, {
      status: "accepted",
      updated_at: Date.now(),
    });

    await ctx.db.insert("friends", {
      user_id: identity.subject,
      friend_id: request.user_id,
      friend_username: sender?.username,
      friend_avatar: sender?.avatar,
      status: "accepted",
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

export const rejectRequest = mutation({
  args: { requestId: v.id("friends") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const request = await ctx.db.get(args.requestId);
    if (!request) throw new Error("Request not found");
    if (
      request.friend_id !== identity.subject &&
      request.user_id !== identity.subject
    ) {
      return { error: "Unauthorized" };
    }

    await ctx.db.delete(args.requestId);
    return { success: true };
  },
});

export const removeFriend = mutation({
  args: { friend_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const link1 = await ctx.db
      .query("friends")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .filter((q) => q.eq(q.field("friend_id"), args.friend_id))
      .first();

    const link2 = await ctx.db
      .query("friends")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.friend_id))
      .filter((q) => q.eq(q.field("friend_id"), identity.subject))
      .first();

    if (link1) await ctx.db.delete(link1._id);
    if (link2) await ctx.db.delete(link2._id);
    return { success: true };
  },
});

export const setNotificationPreference = mutation({
  args: {
    friend_id: v.string(),
    preference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const friendship = await ctx.db
      .query("friends")
      .withIndex("by_user_id", (q) =>
        q.eq("user_id", identity.subject)
      )
      .filter((q) => q.eq(q.field("friend_id"), args.friend_id))
      .first();

    if (!friendship) {
      return { error: "Not friends with this user" };
    }

    await ctx.db.patch(friendship._id, {
      notificationPreference: args.preference,
    });

    return { success: true };
  },
});