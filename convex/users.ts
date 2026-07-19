import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();
    if (!user) return null;
    return {
      ...user,
      email: user.email || identity.email,
    };
  },
});

export const createUser = mutation({
  args: {
    avatar: v.optional(v.string()),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthenticated call to createUser");
    }

    // Check if user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (existingUser) {
      return existingUser;
    }

    const userId = await ctx.db.insert("users", {
      user_id: identity.subject,
      avatar: args.avatar,
      username: args.username,
      email: identity.email,
    });

    return await ctx.db.get(userId);
  },
});

export const changeAvatar = mutation({
  args: { avatarUrl: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (!user) return { error: "User not found" };

    await ctx.db.patch(user._id, { avatar: args.avatarUrl });
    return { success: true };
  },
});

export const changeName = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (!user) return { error: "User not found" };

    await ctx.db.patch(user._id, { username: args.username });
    return { success: true };
  },
});

export const getUserById = query({
  args: { user_id: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id))
      .first();
    return user;
  },
});

export const getUsersByExternalIds = query({
  args: { user_ids: v.array(v.string()) },
  handler: async (ctx, args) => {
    const results = [];
    for (const userId of args.user_ids) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_user_id", (q) => q.eq("user_id", userId))
        .first();
      if (user) results.push(user);
    }
    return results;
  },
});

export const deleteUserAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Unauthenticated" };

    const userId = identity.subject;

    const user = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    if (!user) return { error: "User not found" };

    const friendsAsUser = await ctx.db
      .query("friends")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .collect();

    const friendsAsFriend = await ctx.db
      .query("friends")
      .withIndex("by_friend_id", (q) => q.eq("friend_id", userId))
      .collect();

    for (const f of [...friendsAsUser, ...friendsAsFriend]) {
      await ctx.db.delete(f._id);
    }

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .collect();

    for (const m of memberships) {
      if (m.role === "owner") {
        const room = await ctx.db
          .query("rooms")
          .withIndex("by_room_id", (q) => q.eq("room_id", m.room_id))
          .first();

        if (room) {
          const allMembers = await ctx.db
            .query("roomMembers")
            .withIndex("by_room_id", (q) => q.eq("room_id", m.room_id))
            .collect();

          for (const member of allMembers) {
            await ctx.db.delete(member._id);
          }

          await ctx.db.delete(room._id);
        }
      } else {
        await ctx.db.delete(m._id);
      }
    }

    const presence = await ctx.db
      .query("presence")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .first();

    if (presence) {
      await ctx.db.delete(presence._id);
    }

    const typingIndicators = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .collect();

    for (const t of typingIndicators) {
      await ctx.db.delete(t._id);
    }

    const notifications = await ctx.db
      .query("chatNotifications")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .collect();

    for (const n of notifications) {
      await ctx.db.delete(n._id);
    }

    await ctx.db.delete(user._id);

    return { success: true };
  },
});
