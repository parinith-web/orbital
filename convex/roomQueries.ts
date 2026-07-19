import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRoomDetails = query({
  args: { room_id: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .first();

    if (!room) return null;

    const owner = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .filter((q) => q.eq(q.field("role"), "owner"))
      .first();

    return {
      ...room,
      owner_id: owner?.user_id || null,
    };
  },
});

export const getUserRooms = query({
  args: { user_id: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    if (!args.user_id) return [];

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_user_id", (q) => q.eq("user_id", args.user_id as string))
      .collect();

    const roomsWithCount = await Promise.all(
      memberships.map(async (membership) => {
        const room = await ctx.db
          .query("rooms")
          .withIndex("by_room_id", (q) => q.eq("room_id", membership.room_id))
          .first();

        const allRoomMembers = await ctx.db
          .query("roomMembers")
          .withIndex("by_room_id", (q) => q.eq("room_id", membership.room_id))
          .collect();

        const owner = allRoomMembers.find((m) => m.role === "owner");


        return {
          room_id: membership.room_id,
          Rooms: room,
          memberCount: allRoomMembers.length,
          owner_id: owner?.user_id || null,
          joined_at: membership._creationTime,
        };
      }),
    );

    // Sort by join time (membership creation)
    return roomsWithCount.sort((a, b) => b.joined_at - a.joined_at);
  },
});

export const getRoomMembers = query({
  args: { room_id: v.union(v.string(), v.null()) },
  handler: async (ctx, args) => {
    if (!args.room_id) return [];

    const memberships = await ctx.db
      .query("roomMembers")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id as string))
      .collect();

    const result = await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_user_id", (q) => q.eq("user_id", m.user_id))
          .first();

        const username = user?.username || m.username || "Unknown";
        const avatar = user?.avatar || m.avatar;

        return {
          ...m,
          Users: {
            user_id: m.user_id,
            username,
            avatar,
            _creationTime: user?._creationTime,
          },
        };
      })
    );

    return result;
  },
});
