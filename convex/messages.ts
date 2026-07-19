import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { v } from "convex/values";
import {
  extractFriendId,
  toPreview,
  updateConversationMetadata,
} from "./lib/conversations";
import { createChatNotification } from "./chatNotifications";

export const getAllMessages = query({
  args: {
    conversation_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000; // large limit to effectively get all messages

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation_id", args.conversation_id),
      )
      .order("desc")
      .take(limit);

    const result = await Promise.all(
      messages.map(async (msg) => {
        let finalUrl = msg.file_url;
        if (msg.file_storage_id) {
          finalUrl = await ctx.storage.getUrl(msg.file_storage_id);
        }

        const reactions = await ctx.db
          .query("reactions")
          .withIndex("by_message_id", (q) => q.eq("message_id", msg._id))
          .collect();

        return {
          ...msg,
          file_url: finalUrl,
          sender: {
            user_id: msg.sender_id,
            username: msg.sender_username || "Unknown",
            avatar: msg.sender_avatar,
          },
          reactions: reactions.map((r) => ({
            _id: r._id,
            user_id: r.user_id,
            emoji: r.emoji,
          })),
        };
      }),
    );

    return result;
  },
});

export const searchMessages = query({
  args: { conversation_id: v.string(), query: v.string() },
  handler: async (ctx, args) => {
    if (!args.query) return [];

    const messages = await ctx.db
      .query("messages")
      .withSearchIndex("search_content", (q) =>
        q
          .search("content", args.query)
          .eq("conversation_id", args.conversation_id),
      )
      .take(20);

    const result = messages.map((msg) => ({
      ...msg,
      sender: {
        user_id: msg.sender_id,
        username: msg.sender_username || "Unknown",
        avatar: msg.sender_avatar,
      },
    }));

    return result;
  },
});

/**
 * Extracts @username mentions from message content.
 * Returns array of unique usernames (without the @ symbol).
 */
function extractMentions(content: string | null): string[] {
  if (!content) return [];
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  return [...new Set(mentions)];
}

export const sendMessage = mutation({
  args: {
    conversation_id: v.string(),
    conversation_type: v.union(v.literal("room"), v.literal("direct")),
    msg: v.union(v.string(), v.null()),
    file_storage_id: v.optional(v.id("_storage")),
    file_type: v.union(v.string(), v.null()),
    file_name: v.union(v.string(), v.null()),
    file_size: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const sender = await ctx.db
      .query("users")
      .withIndex("by_user_id", (q) => q.eq("user_id", identity.subject))
      .first();

    const notificationMessage =
      args.msg ||
      (args.file_name ? `Attachment: ${args.file_name}` : "Attachment");

    const insertedMessageId = await ctx.db.insert("messages", {
      conversation_id: args.conversation_id,
      conversation_type: args.conversation_type,
      sender_id: identity.subject,
      sender_username: sender?.username || "Unknown",
      sender_avatar: sender?.avatar,
      content: args.msg || null,
      file_storage_id: args.file_storage_id,
      file_url: null,
      type: args.file_type || null,
      file_name: args.file_name || null,
      file_size: args.file_size,
    });

    // Extract mentions from content and update the message
    const mentions = extractMentions(args.msg);
    await ctx.db.patch(insertedMessageId, { mentions });

    // Pre-resolve mentioned usernames to user IDs for efficient lookup
    const mentionedUserIds = new Set<string>();
    if (mentions.length > 0) {
      await Promise.all(
        mentions.map(async (username) => {
          const user = await ctx.db
            .query("users")
            .withIndex("by_username", (q) => q.eq("username", username))
            .first();
          if (user) mentionedUserIds.add(user.user_id);
        }),
      );
    }

    const now = Date.now();
    const preview = toPreview(args.msg, args.file_name);

    await updateConversationMetadata(
      ctx.db,
      args.conversation_id,
      args.conversation_type,
      identity.subject,
      preview,
      now,
    );

    // to handle notification creation
    if (args.conversation_type === "direct") {
      const friendId = extractFriendId(args.conversation_id, identity.subject);
      if (friendId) {
        // Check friend's notification preference
        const friendPreference = await ctx.db
          .query("friends")
          .withIndex("by_friend_id", (q) => q.eq("friend_id", identity.subject))
          .filter((q) => q.eq(q.field("user_id"), friendId))
          .first();

        const shouldNotify = shouldCreateNotification(
          friendPreference?.notificationPreference ?? "all",
          mentions.length > 0,
        );

        if (shouldNotify) {
          const isMentioned = mentionedUserIds.has(friendId);

          await createChatNotification(ctx, {
            user_id: friendId,
            message_id: insertedMessageId,
            source_type: "direct",
            source_id: identity.subject,
            conversation_id: args.conversation_id,
            source_name: sender?.username || "Unknown user",
            sender_id: identity.subject,
            sender_name: sender?.username || "Unknown user",
            sender_avatar: sender?.avatar || "",
            message: notificationMessage,
            notification_type: "message",
            hasMentions: isMentioned,
          });
        }
      }
      return { success: true };
    }

    if (args.conversation_type === "room") {
      const [room, members] = await Promise.all([
        ctx.db
          .query("rooms")
          .withIndex("by_room_id", (q) => q.eq("room_id", args.conversation_id))
          .first(),
        ctx.db
          .query("roomMembers")
          .withIndex("by_room_id", (q) => q.eq("room_id", args.conversation_id))
          .collect(),
      ]);

      const hasMentions = mentions.length > 0;

      // Filter recipients based on their notification preferences
      const validRecipients = await Promise.all(
        members
          .filter((member) => member.user_id !== identity.subject)
          .map(async (member) => {
            const shouldNotify = shouldCreateNotification(
              member.notificationPreference,
              hasMentions,
              member.user_id,
            );
            return { member, shouldNotify };
          }),
      );

      await Promise.all(
        validRecipients
          .filter(({ shouldNotify }) => shouldNotify)
          .map(async ({ member }) => {
            const isMentioned = mentionedUserIds.has(member.user_id);

            await createChatNotification(ctx, {
              user_id: member.user_id,
              message_id: insertedMessageId,
              source_type: "room",
              source_id: args.conversation_id,
              conversation_id: args.conversation_id,
              source_name: room?.room_name || args.conversation_id,
              sender_id: identity.subject,
              sender_name: sender?.username || "Unknown user",
              sender_avatar: sender?.avatar || "",
              message: notificationMessage,
              notification_type: "message",
              hasMentions: isMentioned,
            });
          }),
      );
    }

    return { success: true };
  },
});

function shouldCreateNotification(
  preference: string | undefined,
  hasMentions: boolean,
  recipientId?: string,
): boolean {
  if (!preference || preference === "all") return true;
  if (preference === "none") return false;
  if (preference === "mentions") return hasMentions;
  return true;
}

export const deleteMessage = mutation({
  args: { msg_id: v.id("messages") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const msg = await ctx.db.get(args.msg_id);
    if (!msg) return { error: "Message not found" };

    if (msg.sender_id !== identity.subject) {
      return { error: "Unauthorized to delete message" };
    }

    await ctx.db.delete(args.msg_id);
    if (msg.file_storage_id) {
      await ctx.storage.delete(msg.file_storage_id);
    }

    // update last_msg_preview to the previous message after deletion
    const latestMsg = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation_id", msg.conversation_id),
      )
      .order("desc")
      .first();

    const preview = toPreview(
      latestMsg?.content ?? null,
      latestMsg?.file_name ?? null,
    );
    const timestamp = latestMsg?._creationTime || 0;

    await updateConversationMetadata(
      ctx.db,
      msg.conversation_id,
      msg.conversation_type,
      msg.sender_id,
      preview,
      timestamp,
    );

    return { success: true };
  },
});

export const updateMessage = mutation({
  args: {
    msg_id: v.id("messages"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const msg = await ctx.db.get(args.msg_id);
    if (!msg) return { error: "Message not found" };

    if (msg.sender_id !== identity.subject) {
      return { error: "Unauthorized to edit message" };
    }

    await ctx.db.patch(args.msg_id, {
      content: args.content,
      edited: true,
    });

    // to update conversation metadata if this is the latest message
    const latestMsg = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation_id", msg.conversation_id),
      )
      .order("desc")
      .first();

    if (latestMsg?._id === args.msg_id) {
      const preview = toPreview(args.content, msg.file_name);
      await updateConversationMetadata(
        ctx.db,
        msg.conversation_id,
        msg.conversation_type,
        msg.sender_id,
        preview,
        latestMsg._creationTime,
      );
    }

    return { success: true };
  },
});

export const getMedia = query({
  args: { conversation_id: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const limit = args.limit ?? 100;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation_id", args.conversation_id),
      )
      .filter((q) => q.neq(q.field("file_storage_id"), undefined))
      .order("desc")
      .take(limit);

    const result = await Promise.all(
      messages.map(async (msg) => {
        let finalUrl = msg.file_url;
        if (msg.file_storage_id) {
          finalUrl = await ctx.storage.getUrl(msg.file_storage_id);
        }
        return {
          ...msg,
          file_url: finalUrl,
          sender: {
            user_id: msg.sender_id,
            username: msg.sender_username || "Unknown",
            avatar: msg.sender_avatar,
          },
        };
      }),
    );

    return result.filter((m) => m.file_url && m.type);
  },
});

// ─── Pagination Queries ───────────────────────────────────────────────────────
//
// These queries power the windowed pagination system in the chat UI.
// They use _creationTime as a cursor via the `by_conversation` index, which
// implicitly appends _creationTime after the `conversation_id` prefix field.
// This gives us efficient range scans without needing a separate compound index.
// ───────────────────────────────────────────────────────────────────────────────

/**
 * Resolves file storage URLs and joins reactions for a list of raw messages.
 * Produces the same shape as getAllMessages so that frontend types stay compatible.
 * This is an internal helper — not exported as a Convex function.
 */
async function enrichMessagesWithSenderAndReactions(
  ctx: QueryCtx,
  rawMessages: Doc<"messages">[],
) {
  return Promise.all(
    rawMessages.map(async (message) => {
      let resolvedFileUrl = message.file_url;
      if (message.file_storage_id) {
        resolvedFileUrl =
          (await ctx.storage.getUrl(message.file_storage_id)) ?? null;
      }

      const reactions = await ctx.db
        .query("reactions")
        .withIndex("by_message_id", (q) => q.eq("message_id", message._id))
        .collect();

      return {
        ...message,
        file_url: resolvedFileUrl,
        sender: {
          user_id: message.sender_id,
          username: message.sender_username || "Unknown",
          avatar: message.sender_avatar,
        },
        reactions: reactions.map((reaction) => ({
          _id: reaction._id,
          user_id: reaction.user_id,
          emoji: reaction.emoji,
        })),
      };
    }),
  );
}

/**
 * Real-time subscription for LIVE mode.
 * Returns the latest N messages in ascending (chronological) order.
 * Mount this with useQuery() — it automatically pushes new messages as they arrive.
 */
export const subscribeLive = query({
  args: {
    conversation_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Fetch newest-first, then reverse for chronological display order
    const newestFirst = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation_id", args.conversation_id),
      )
      .order("desc")
      .take(limit);

    const chronological = newestFirst.reverse();
    return enrichMessagesWithSenderAndReactions(ctx, chronological);
  },
});

/**
 * One-shot fetch of the latest N messages.
 * Same result shape as subscribeLive but intended for imperative (non-reactive) use
 * via convexClient.query() when initializing or catching up.
 */
export const getLatest = query({
  args: {
    conversation_id: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    const newestFirst = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversation_id", args.conversation_id),
      )
      .order("desc")
      .take(limit);

    const chronological = newestFirst.reverse();
    return enrichMessagesWithSenderAndReactions(ctx, chronological);
  },
});

/**
 * Cursor-based backward pagination.
 * Returns up to `limit` messages OLDER than `before_creation_time`, in ascending order.
 * The caller passes the _creationTime of the oldest message in its current window.
 */
export const getBefore = query({
  args: {
    conversation_id: v.string(),
    before_creation_time: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Range scan: conversation_id = X AND _creationTime < before_creation_time
    // Ordered desc so .take(limit) grabs the N closest to the cursor, then reverse
    const newestFirst = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q
          .eq("conversation_id", args.conversation_id)
          .lt("_creationTime", args.before_creation_time),
      )
      .order("desc")
      .take(limit);

    const chronological = newestFirst.reverse();
    return enrichMessagesWithSenderAndReactions(ctx, chronological);
  },
});

/**
 * Cursor-based forward pagination.
 * Returns up to `limit` messages NEWER than `after_creation_time`, in ascending order.
 * The caller passes the _creationTime of the newest message in its current window.
 */
export const getAfter = query({
  args: {
    conversation_id: v.string(),
    after_creation_time: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    // Range scan: conversation_id = X AND _creationTime > after_creation_time
    // Already ascending, so .take(limit) gets the N closest to the cursor
    const chronological = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q
          .eq("conversation_id", args.conversation_id)
          .gt("_creationTime", args.after_creation_time),
      )
      .order("asc")
      .take(limit);

    return enrichMessagesWithSenderAndReactions(ctx, chronological);
  },
});

/**
 * Fetches a window of messages centered around a target message.
 * Returns `half_limit` messages before + the target + `half_limit` messages after,
 * all in ascending order. Also returns the index of the target within the array.
 *
 * Used by jump-to-message (from search results or linked messages).
 */
export const getAround = query({
  args: {
    conversation_id: v.string(),
    target_message_id: v.id("messages"),
    half_limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const halfLimit = args.half_limit ?? 25;

    const targetMessage = await ctx.db.get(args.target_message_id);
    if (!targetMessage) {
      return { messages: [], targetIndex: -1 };
    }

    // Verify the message belongs to the expected conversation
    if (targetMessage.conversation_id !== args.conversation_id) {
      return { messages: [], targetIndex: -1 };
    }

    // Fetch messages before the target (newest-first, then reverse)
    const beforeNewestFirst = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q
          .eq("conversation_id", args.conversation_id)
          .lt("_creationTime", targetMessage._creationTime),
      )
      .order("desc")
      .take(halfLimit);
    const beforeChronological = beforeNewestFirst.reverse();

    // Fetch messages after the target (already ascending)
    const afterChronological = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q
          .eq("conversation_id", args.conversation_id)
          .gt("_creationTime", targetMessage._creationTime),
      )
      .order("asc")
      .take(halfLimit);

    // Combine: before + target + after
    const allMessages = [
      ...beforeChronological,
      targetMessage,
      ...afterChronological,
    ];
    const enrichedMessages = await enrichMessagesWithSenderAndReactions(
      ctx,
      allMessages,
    );

    return {
      messages: enrichedMessages,
      targetIndex: beforeChronological.length,
    };
  },
});
