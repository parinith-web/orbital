import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const cleanup = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 30000;

    const oldRecords = await ctx.db
      .query("typingIndicators")
      .filter((q) => q.lt(q.field("updated_at"), cutoff))
      .collect();

    for (const record of oldRecords) {
      await ctx.db.delete(record._id);
    }
  },
});

export const updateTyping = mutation({
  args: { room_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .filter((q) => q.eq(q.field("room_id"), args.room_id))
      .first();

    const now = Date.now();
    if (existing) {
      await ctx.db.patch(existing._id, { updated_at: now });
    } else {
      await ctx.db.insert("typingIndicators", {
        user_id: identity.subject,
        room_id: args.room_id,
        updated_at: now,
      });
    }
  },
});

export const removeTyping = mutation({
  args: { room_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const existing = await ctx.db
      .query("typingIndicators")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .filter((q) => q.eq(q.field("room_id"), args.room_id))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

export const getTypingUsers = query({
  args: { room_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const thirtySecondsAgo = Date.now() - 4000;

    const typists = await ctx.db
      .query("typingIndicators")
      .withIndex("by_room_id", (q) => q.eq("room_id", args.room_id))
      .filter((q) => q.gte(q.field("updated_at"), thirtySecondsAgo))
      .collect();

    const otherTypists = typists.filter((t) => t.user_id !== identity.subject);

    const usersWithNames = await Promise.all(
      otherTypists.map(async (t) => {
        const user = await ctx.db
          .query("users")
          .withIndex("by_user_id", (q) => q.eq("user_id", t.user_id))
          .first();
        return {
          user_id: t.user_id,
          username: user?.username || "Unknown",
        };
      })
    );

    return usersWithNames;
  },
});
