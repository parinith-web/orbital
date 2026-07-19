import { mutation, query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export const update = mutation({
  args: { status: v.union(v.literal("online"), v.literal("away")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        updated_at: Date.now(),
      });
    } else {
      await ctx.db.insert("presence", {
        user_id: identity.subject,
        status: args.status,
        updated_at: Date.now(),
      });
    }

    // Schedule cleanup on presence activity
    const existingScheduler = await ctx.db.query("presenceCleanupScheduler").first();
    if (existingScheduler) {
      await ctx.scheduler.cancel(existingScheduler.jobId);
      await ctx.db.delete(existingScheduler._id);
    }
    const jobId = await ctx.scheduler.runAfter(STALE_THRESHOLD, internal.presence.cleanupStalePresence);
    await ctx.db.insert("presenceCleanupScheduler", { jobId });
  },
});

// Lightweight heartbeat — only touches updated_at, called every 3 minutes
export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { updated_at: Date.now() });
    }

    // Schedule cleanup on presence activity
    const existingScheduler = await ctx.db.query("presenceCleanupScheduler").first();
    if (existingScheduler) {
      await ctx.scheduler.cancel(existingScheduler.jobId);
      await ctx.db.delete(existingScheduler._id);
    }
    const jobId = await ctx.scheduler.runAfter(STALE_THRESHOLD, internal.presence.cleanupStalePresence);
    await ctx.db.insert("presenceCleanupScheduler", { jobId });
  },
});

// Explicit offline — called on beforeunload/pagehide for instant cleanup
export const goOffline = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }

    // Cancel cleanup if no presence remains
    const remaining = await ctx.db.query("presence").first();
    if (!remaining) {
      const existingScheduler = await ctx.db.query("presenceCleanupScheduler").first();
      if (existingScheduler) {
        await ctx.scheduler.cancel(existingScheduler.jobId);
        await ctx.db.delete(existingScheduler._id);
      }
    }
  },
});

// Cron cleanup — deletes records that haven't heartbeated in >5 minutes
export const cleanupStalePresence = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Remove current job from tracker (it's now running)
    const existingScheduler = await ctx.db.query("presenceCleanupScheduler").first();
    if (existingScheduler) {
      await ctx.db.delete(existingScheduler._id);
    }

    // Delete stale records using indexed query
    const cutoff = Date.now() - STALE_THRESHOLD;
    const staleRecords = await ctx.db
      .query("presence")
      .withIndex("by_updated_at", (q) => q.lt("updated_at", cutoff))
      .collect();
    for (const record of staleRecords) {
      await ctx.db.delete(record._id);
    }

    // Reschedule if presence records remain
    const remaining = await ctx.db.query("presence").first();
    if (remaining) {
      const jobId = await ctx.scheduler.runAfter(STALE_THRESHOLD, internal.presence.cleanupStalePresence);
      await ctx.db.insert("presenceCleanupScheduler", { jobId });
    }
  },
});

export const getOnlineUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("presence").collect();
  },
});
