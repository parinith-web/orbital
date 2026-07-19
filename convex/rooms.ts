import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const joinRoom = mutation({
  args: { room_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const sender = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .first();

    if (!room) return { error: "Room does not exist" };

    const existingMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .filter((q) => q.eq(q.field("user_id"), identity.subject))
      .first();

    if (existingMember) {
      return { error: "You are already in this room" };
    }

    await ctx.db.insert("roomMembers", {
      room_id: args.room_id,
      user_id: identity.subject,
      username: sender?.username,
      avatar: sender?.avatar,
      role: "member",
    });

    await ctx.db.insert("messages", {
      conversation_id: args.room_id,
      conversation_type: "room",
      sender_id: identity.subject,
      sender_username: sender?.username || "Unknown",
      sender_avatar: sender?.avatar,
      content: "joined the room",
      type: "system",
      file_url: null,
      file_name: null,
    });

    return { success: true };
  },
});

export const createRoom = mutation({
  args: { room_name: v.string(), room_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const sender = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    const roomId = await ctx.db.insert("rooms", {
      room_name: args.room_name,
      room_id: args.room_id,
      is_group: true,
    });

    await ctx.db.insert("roomMembers", {
      room_id: args.room_id,
      user_id: identity.subject,
      username: sender?.username,
      avatar: sender?.avatar,
      role: "owner",
    });

    return { room_id: args.room_id };
  },
});

export const renameRoom = mutation({
  args: { room_id: v.string(), new_name: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .first();

    if (!room) return { error: "Room not found" };

    const existingMember = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .filter((q) => q.eq(q.field("user_id"), identity.subject))
      .first();

    if (!existingMember || existingMember.role !== "owner") {
      return { error: "Unauthorized" };
    }

    await ctx.db.patch(room._id, { room_name: args.new_name });
    return { success: true };
  },
});

export const leaveRoom = mutation({
  args: { room_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const sender = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .filter((q) => q.eq(q.field("user_id"), identity.subject))
      .first();

    if (!membership) return { error: "Not a member" };

    if (membership.role === "owner") {
      return { error: "Owner cannot leave room, must delete or transfer ownership" };
    }

    await ctx.db.delete(membership._id);

    await ctx.db.insert("messages", {
      conversation_id: args.room_id,
      conversation_type: "room",
      sender_id: identity.subject,
      sender_username: sender?.username || "Unknown",
      sender_avatar: sender?.avatar,
      content: "left the room",
      type: "system",
      file_url: null,
      file_name: null,
    });

    return { success: true };
  },
});

export const deleteRoom = mutation({
  args: { room_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .filter((q) => q.eq(q.field("user_id"), identity.subject))
      .first();

    if (!membership || membership.role !== "owner") {
      return { error: "Unauthorized" };
    }

    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .first();

    if (room) {
      await ctx.db.delete(room._id);
    }

    const allMembers = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .collect();

    for (const m of allMembers) {
      await ctx.db.delete(m._id);
    }

    return { success: true };
  },
});

export const setNotificationPreference = mutation({
  args: {
    room_id: v.string(),
    preference: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const membership = await ctx.db
      .query("roomMembers")
      .withIndex("by_user_room", (q) =>
        q.eq("user_id", identity.subject).eq("room_id", args.room_id)
      )
      .first();

    if (!membership) {
      return { error: "Not a member of this room" };
    }

    await ctx.db.patch(membership._id, {
      notificationPreference: args.preference,
    });

    return { success: true };
  },
});
