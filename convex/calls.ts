import { query, mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { createChatNotification } from "./chatNotifications";
import { extractFriendId } from "./lib/conversations";

function isDirectConversationId(roomId: string): boolean {
  return roomId.startsWith("direct_");
}

function getCallNotificationKey(callId: Id<"calls">): string {
  return `call:${callId}`;
}

//TODO: change to common function
async function getUserSummary(ctx: MutationCtx, userId: string) {
  const user = await ctx.db
    .query("users")
    .withIndex("by_user_id", (q) => q.eq("user_id", userId))
    .first();

  return {
    name: user?.username || "Unknown user",
    avatar: user?.avatar || "",
  };
}

async function createCallNotifications(
  ctx: MutationCtx,
  args: { callId: Id<"calls">; roomId: string; initiatorId: string },
) {
  const sender = await getUserSummary(ctx, args.initiatorId);
  const notificationKey = getCallNotificationKey(args.callId);

  if (isDirectConversationId(args.roomId)) {
    const recipientId = extractFriendId(args.roomId, args.initiatorId);
    if (recipientId) {
      await createChatNotification(ctx, {
        user_id: recipientId,
        message_id: notificationKey,
        source_type: "direct",
        source_id: args.initiatorId,
        conversation_id: args.roomId,
        source_name: sender.name,
        sender_id: args.initiatorId,
        sender_name: sender.name,
        sender_avatar: sender.avatar,
        message: `${sender.name} started a call`,
        notification_type: "call",
        call_id: args.callId,
        call_status: "active",
      });
    }

    return;
  }

  const room = await ctx.db
    .query("rooms")
    .withIndex("by_room_id", (q) => q.eq("room_id", args.roomId))
    .first();
  const members = await ctx.db
    .query("roomMembers")
    .withIndex("by_room_id", (q) => q.eq("room_id", args.roomId))
    .collect();

  const recipientIds = Array.from(
    new Set(
      members
        .map((member) => member.user_id)
        .filter((userId) => userId !== args.initiatorId),
    ),
  );

  await Promise.all(
    recipientIds.map((recipientId) =>
      createChatNotification(ctx, {
        user_id: recipientId,
        message_id: notificationKey,
        source_type: "room",
        source_id: args.roomId,
        conversation_id: args.roomId,
        source_name: room?.room_name || args.roomId,
        sender_id: args.initiatorId,
        sender_name: sender.name,
        sender_avatar: sender.avatar,
        message: `${sender.name} started a call`,
        notification_type: "call",
        call_id: args.callId,
        call_status: "active",
      }),
    ),
  );
}

async function markCallNotificationsEnded(
  ctx: MutationCtx,
  callId: Id<"calls">,
) {
  const notifications = await ctx.db
    .query("chatNotifications")
    .withIndex("by_call_id", (q) => q.eq("call_id", callId))
    .collect();

  await Promise.all(
    notifications.map(async (notification) => {
      const senderName = notification.sender_name || "Someone";
      await ctx.db.patch(notification._id, {
        message: `${senderName}'s call ended`,
        call_status: "ended",
      });
    }),
  );
}

export const startCall = mutation({
  args: { roomId: v.string(), peerId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const callId = await ctx.db.insert("calls", {
      roomId: args.roomId,
      startedAt: Date.now(),
      participants: [identity.subject],
      allParticipants: [identity.subject],
      activePeerIds: [{ userId: identity.subject, peerId: args.peerId }],
      mediaStates: [{ userId: identity.subject, isMuted: false, isVideoOn: false, isScreenSharing: false }],
      initiatorId: identity.subject,
      isActive: true,
    });

    await createCallNotifications(ctx, {
      callId,
      roomId: args.roomId,
      initiatorId: identity.subject,
    });

    return { callId };
  },
});

export const joinCall = mutation({
  args: { callId: v.id("calls"), peerId: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return { error: "Not authenticated" };

    const call = await ctx.db.get(args.callId);
    if (!call) return { error: "Call not found" };
    if (!call.isActive) {
      return { error: "Call is no longer active" };
    }

    const isNewHistorical = !call.allParticipants.includes(identity.subject);
    const isNewActive = !call.participants.includes(identity.subject);

    // update participants list normally
    const participants = isNewActive
      ? [...call.participants, identity.subject]
      : call.participants;

    const allParticipants = isNewHistorical
      ? [...call.allParticipants, identity.subject]
      : call.allParticipants;

    // update specialized peer ID list for discrete signaling
    const activePeerIds = call.activePeerIds || [];
    const entryIndex = activePeerIds.findIndex(
      (p) => p.userId === identity.subject,
    );

    // always update the peerId to the latest session to handle refreshes
    if (entryIndex >= 0) {
      activePeerIds[entryIndex].peerId = args.peerId;
    } else {
      activePeerIds.push({ userId: identity.subject, peerId: args.peerId });
    }

    // Update media states
    const mediaStates = call.mediaStates || [];
    const stateIndex = mediaStates.findIndex((m) => m.userId === identity.subject);
    if (stateIndex >= 0) {
      mediaStates[stateIndex] = { userId: identity.subject, isMuted: false, isVideoOn: false, isScreenSharing: false };
    } else {
      mediaStates.push({ userId: identity.subject, isMuted: false, isVideoOn: false, isScreenSharing: false });
    }

    await ctx.db.patch(args.callId, {
      participants,
      allParticipants,
      activePeerIds,
      mediaStates,
    });

    return { success: true };
  },
});

export const updateMediaState = mutation({
  args: { 
    callId: v.id("calls"), 
    isMuted: v.optional(v.boolean()), 
    isVideoOn: v.optional(v.boolean()),
    isScreenSharing: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const call = await ctx.db.get(args.callId);
    if (!call || !call.isActive) return;

    const mediaStates = [...(call.mediaStates || [])];
    const index = mediaStates.findIndex((m) => m.userId === identity.subject);

    if (index >= 0) {
      mediaStates[index] = {
        ...mediaStates[index],
        isMuted: args.isMuted ?? mediaStates[index].isMuted,
        isVideoOn: args.isVideoOn ?? mediaStates[index].isVideoOn,
        isScreenSharing: args.isScreenSharing ?? mediaStates[index].isScreenSharing ?? false,
      };
    } else {
      mediaStates.push({
        userId: identity.subject,
        isMuted: args.isMuted ?? false,
        isVideoOn: args.isVideoOn ?? false,
        isScreenSharing: args.isScreenSharing ?? false,
      });
    }

    await ctx.db.patch(args.callId, { mediaStates });
    return { success: true };
  },
});

export const leaveCall = mutation({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const call = await ctx.db.get(args.callId);
    if (!call) return;

    const newParticipants = call.participants.filter(
      (p) => p !== identity.subject,
    );
    const newActivePeerIds = (call.activePeerIds || []).filter(
      (p) => p.userId !== identity.subject,
    );
    const newMediaStates = (call.mediaStates || []).filter(
      (m) => m.userId !== identity.subject,
    );

    if (newParticipants.length === 0) {
      await ctx.db.patch(args.callId, {
        isActive: false,
        endedAt: Date.now(),
        participants: [],
        activePeerIds: [],
        mediaStates: [],
      });
      await markCallNotificationsEnded(ctx, args.callId);
    } else {
      await ctx.db.patch(args.callId, {
        participants: newParticipants,
        activePeerIds: newActivePeerIds,
        mediaStates: newMediaStates,
      });
    }

    return { success: true };
  },
});

export const endCall = mutation({
  args: { callId: v.id("calls") },
  handler: async (ctx, args) => {
    const call = await ctx.db.get(args.callId);
    if (!call) return;
    if (!call.isActive && call.endedAt) return;

    await ctx.db.patch(args.callId, {
      isActive: false,
      endedAt: Date.now(),
      participants: [],
    });
    await markCallNotificationsEnded(ctx, args.callId);

    return { success: true };
  },
});

export const getActiveCalls = query({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("calls")
      .withIndex("by_active", (q) =>
        q.eq("roomId", args.roomId).eq("isActive", true),
      )
      .collect();
  },
});

export const getRecentCalls = query({
  args: { roomId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const calls = await ctx.db
      .query("calls")
      .withIndex("by_room_id", (q) => q.eq("roomId", args.roomId))
      .order("desc")
      .take(args.limit ?? 20);
    return calls.filter((c) => !c.isActive || c.endedAt !== undefined);
  },
});
export const listAllActiveCalls = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const [roomMemberships, friendships, activeCalls] = await Promise.all([
      ctx.db
        .query("roomMembers")
        .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
        .collect(),
      ctx.db
        .query("friends")
        .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
        .filter((q) => q.eq(q.field("status"), "accepted"))
        .collect(),
      ctx.db
        .query("calls")
        .withIndex("by_status", (q) => q.eq("isActive", true))
        .collect(),
    ]);

    const visibleConversationIds = new Set<string>([
      ...roomMemberships.map((membership) => membership.room_id),
      ...friendships.map(
        (friendship) =>
          `direct_${[identity.subject, friendship.friend_id].sort().join("_")}`,
      ),
    ]);

    return activeCalls.filter((call) =>
      visibleConversationIds.has(call.roomId),
    );
  },
});
