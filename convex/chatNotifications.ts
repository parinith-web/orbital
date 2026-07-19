import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { v } from "convex/values";

const MAX_NOTIFICATIONS_PER_USER = 100;

type ChatNotificationInsertArgs = {
  user_id: string;
  message_id: string;
  source_type: "room" | "direct";
  source_id: string;
  conversation_id?: string;
  source_name: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  message: string;
  notification_type?: "message" | "call";
  call_id?: Id<"calls">;
  call_status?: "active" | "ended";
  hasMentions?: boolean;
};

function normalizeConversationId(input: {
  conversation_id?: string;
  source_id: string;
}) {
  return input.conversation_id ?? input.source_id;
}

async function applyUnreadDelta(
  ctx: MutationCtx,
  args: {
    userId: string;
    conversationId: string;
    sourceType: "room" | "direct";
    sourceId: string;
    delta: number;
    hasMentions?: boolean;
  },
) {
  if (args.delta === 0) return;

  const existing = await ctx.db
    .query("unreadCounters")
    .withIndex("by_user_conversation", (q) =>
      q.eq("user_id", args.userId).eq("conversation_id", args.conversationId),
    )
    .first();

  const next = Math.max(0, (existing?.unread_count ?? 0) + args.delta);

  if (next === 0) {
    if (existing) {
      await ctx.db.delete(existing._id);
    }
    return;
  }

  const now = Date.now();
  if (existing) {
    const updates: Record<string, unknown> = {
      unread_count: next,
      updated_at: now,
      source_type: args.sourceType,
      source_id: args.sourceId,
    };
    // Only update has_unread_mentions if explicitly set to true (don't clear it)
    if (args.hasMentions === true) {
      updates.has_unread_mentions = true;
    }
    await ctx.db.patch(existing._id, updates);
    return;
  }

  await ctx.db.insert("unreadCounters", {
    user_id: args.userId,
    conversation_id: args.conversationId,
    source_type: args.sourceType,
    source_id: args.sourceId,
    unread_count: next,
    updated_at: now,
    has_unread_mentions: args.hasMentions ? true : undefined,
  });
}

async function removeConversationCounter(
  ctx: MutationCtx,
  args: { userId: string; conversationId: string },
) {
  const counter = await ctx.db
    .query("unreadCounters")
    .withIndex("by_user_conversation", (q) =>
      q.eq("user_id", args.userId).eq("conversation_id", args.conversationId),
    )
    .first();

  if (counter) {
    await ctx.db.delete(counter._id);
  }
}

async function clearUserCounters(ctx: MutationCtx, userId: string) {
  const counters = await ctx.db
    .query("unreadCounters")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .collect();

  await Promise.all(counters.map((counter) => ctx.db.delete(counter._id)));
}

export async function createChatNotification(
  ctx: MutationCtx,
  notification: ChatNotificationInsertArgs,
) {
  const conversationId = normalizeConversationId(notification);

  const id = await ctx.db.insert("chatNotifications", {
    ...notification,
    conversation_id: conversationId,
  });

  await applyUnreadDelta(ctx, {
    userId: notification.user_id,
    conversationId,
    sourceType: notification.source_type,
    sourceId: notification.source_id,
    delta: 1,
    hasMentions: notification.hasMentions,
  });

  await pruneOldNotifications(ctx, notification.user_id);
  return id;
}

export const getUnreadCounters = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const counters = await ctx.db
      .query("unreadCounters")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .collect();

    return counters.map((counter) => ({
      conversationId: counter.conversation_id,
      sourceType: counter.source_type,
      sourceId: counter.source_id,
      unreadCount: counter.unread_count,
      updatedAt: counter.updated_at,
      hasUnreadMentions: counter.has_unread_mentions ?? false,
    }));
  },
});

export const getMessageNotifications = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const notifications = await ctx.db
      .query("chatNotifications")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .order("desc")
      .take(MAX_NOTIFICATIONS_PER_USER);

    const callIds = Array.from(
      new Set(
        notifications
          .filter((notification) => notification.call_id)
          .map((notification) => notification.call_id!),
      ),
    );

    const calls = await Promise.all(
      callIds.map((callId) => ctx.db.get(callId)),
    );
    const callsById = new Map(
      callIds.map((callId, index) => [callId, calls[index]]),
    );

    return notifications.map((notification) => {
      const call = notification.call_id
        ? (callsById.get(notification.call_id) ?? null)
        : null;

      return {
        id: notification._id,
        messageId: notification.message_id,
        sourceType: notification.source_type,
        sourceId: notification.source_id,
        conversationId: notification.conversation_id ?? notification.source_id,
        sourceName: notification.source_name,
        senderId: notification.sender_id,
        senderName: notification.sender_name,
        senderAvatar: notification.sender_avatar || "",
        message: notification.message,
        notificationType: notification.notification_type ?? "message",
        callId: notification.call_id ?? null,
        callStatus: notification.call_status ?? null,
        participantIds:
          notification.notification_type === "call"
            ? call?.allParticipants || call?.participants || []
            : [],
        createdAt: notification._creationTime,
        readAt: notification.read_at,
        isRead: notification.read_at !== undefined,
        hasMentions: notification.hasMentions ?? false,
      };
    });
  },
});

export const markNotificationRead = mutation({
  args: { notification_id: v.id("chatNotifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const notification = await ctx.db.get(args.notification_id);
    if (!notification) return;
    if (notification.user_id !== identity.subject)
      throw new Error("Unauthorized");
    if (notification.read_at !== undefined) return;

    const readAt = Date.now();
    await ctx.db.patch(args.notification_id, { read_at: readAt });

    await applyUnreadDelta(ctx, {
      userId: notification.user_id,
      conversationId: normalizeConversationId(notification),
      sourceType: notification.source_type,
      sourceId: notification.source_id,
      delta: -1,
    });
  },
});

export const markConversationNotificationsRead = mutation({
  args: { conversation_id: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const notifications = await ctx.db
      .query("chatNotifications")
      .withIndex("by_user_conversation", (q) =>
        q
          .eq("user_id", identity.subject)
          .eq("conversation_id", args.conversation_id),
      )
      .collect();

    const readAt = Date.now();
    const unreadNotifications = notifications.filter(
      (notification) => notification.read_at === undefined,
    );

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          read_at: readAt,
        }),
      ),
    );

    if (unreadNotifications.length > 0) {
      await removeConversationCounter(ctx, {
        userId: identity.subject,
        conversationId: args.conversation_id,
      });
    }
  },
});

export const markAllNotificationsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const notifications = await ctx.db
      .query("chatNotifications")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .collect();

    const readAt = Date.now();
    const unreadNotifications = notifications.filter(
      (notification) => notification.read_at === undefined,
    );

    await Promise.all(
      unreadNotifications.map((notification) =>
        ctx.db.patch(notification._id, {
          read_at: readAt,
        }),
      ),
    );

    if (unreadNotifications.length > 0) {
      await clearUserCounters(ctx, identity.subject);
    }
  },
});

export async function pruneOldNotifications(ctx: MutationCtx, userId: string) {
  const newest = await ctx.db
    .query("chatNotifications")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .order("desc")
    .take(MAX_NOTIFICATIONS_PER_USER + 1);

  if (newest.length <= MAX_NOTIFICATIONS_PER_USER) {
    return;
  }

  const oldest = await ctx.db
    .query("chatNotifications")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .order("asc")
    .first();

  if (oldest) {
    if (oldest.read_at === undefined) {
      await applyUnreadDelta(ctx, {
        userId: oldest.user_id,
        conversationId: normalizeConversationId(oldest),
        sourceType: oldest.source_type,
        sourceId: oldest.source_id,
        delta: -1,
      });
    }
    await ctx.db.delete(oldest._id);
  }
}

export const removeNotification = mutation({
  args: { notification_id: v.id("chatNotifications") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const notification = await ctx.db.get(args.notification_id);
    if (!notification) return;
    if (notification.user_id !== identity.subject)
      throw new Error("Unauthorized");

    if (notification.read_at === undefined) {
      await applyUnreadDelta(ctx, {
        userId: notification.user_id,
        conversationId: normalizeConversationId(notification),
        sourceType: notification.source_type,
        sourceId: notification.source_id,
        delta: -1,
      });
    }

    await ctx.db.delete(args.notification_id);
  },
});

export const clearAllNotifications = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const notifications = await ctx.db
      .query("chatNotifications")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .collect();

    await clearUserCounters(ctx, identity.subject);

    await Promise.all(
      notifications.map((notification) => ctx.db.delete(notification._id)),
    );
  },
});

export const cleanup = mutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;

    const oldNotifications = await ctx.db
      .query("chatNotifications")
      .filter((q) => q.lt(q.field("_creationTime"), cutoff))
      .collect();

    for (const notification of oldNotifications) {
      if (notification.read_at === undefined) {
        await applyUnreadDelta(ctx, {
          userId: notification.user_id,
          conversationId: normalizeConversationId(notification),
          sourceType: notification.source_type,
          sourceId: notification.source_id,
          delta: -1,
        });
      }
      await ctx.db.delete(notification._id);
    }
  },
});
