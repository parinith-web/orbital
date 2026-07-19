import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const toggleReaction = mutation({
  args: {
    messageId: v.id("messages"),
    emoji: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false, error: "You must be logged in to react" };
    }

    const userId = identity.subject;

    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_message_id", (q) => q.eq("message_id", args.messageId))
      .filter((q) => 
        q.and(
          q.eq(q.field("user_id"), userId),
          q.eq(q.field("emoji"), args.emoji)
        )
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { success: true, action: "removed" };
    } else {
      await ctx.db.insert("reactions", {
        message_id: args.messageId,
        user_id: userId,
        emoji: args.emoji,
      });
      return { success: true, action: "added" };
    }
  },
});

export const getReactions = query({
  args: { messageId: v.id("messages") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("reactions")
      .withIndex("by_message_id", (q) => q.eq("message_id", args.messageId))
      .collect();
  },
});
