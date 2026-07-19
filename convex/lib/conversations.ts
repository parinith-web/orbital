import { DatabaseReader, DatabaseWriter } from "../_generated/server";

const PREVIEW_MAX_LENGTH = 100;

// to build id for DMs
export function buildDirectConversationId(
  userId1: string,
  userId2: string,
): string {
  const sorted = [userId1, userId2].sort();
  return `direct_${sorted[0]}_${sorted[1]}`;
}

// to extract user id from a direct conversation id
export function extractFriendId(
  conversationId: string,
  currentUserId: string,
): string | null {
  if (!conversationId.startsWith("direct_")) return null;
  const idsContent = conversationId.slice("direct_".length);

  if (idsContent.startsWith(currentUserId + "_")) {
    return idsContent.slice(currentUserId.length + 1);
  }
  if (idsContent.endsWith("_" + currentUserId)) {
    return idsContent.slice(0, idsContent.length - currentUserId.length - 1);
  }

  return null;
}

// to make a preview from content or filename
export function toPreview(
  content: string | null,
  fileName: string | null,
): string {
  return (content || fileName || "Attachment").slice(0, PREVIEW_MAX_LENGTH);
}

// to look up both directions of a friendship pair
export async function findFriendshipPair(
  db: DatabaseReader,
  userId: string,
  friendId: string,
) {
  const [mine, theirs] = await Promise.all([
    db
      .query("friends")
      .withIndex("by_user_id", (q) => q.eq("user_id", userId))
      .filter((q) => q.eq(q.field("friend_id"), friendId))
      .first(),
    db
      .query("friends")
      .withIndex("by_user_id", (q) => q.eq("user_id", friendId))
      .filter((q) => q.eq(q.field("friend_id"), userId))
      .first(),
  ]);
  return { mine, theirs };
}

// to look up a room membership
export async function findMembership(
  db: DatabaseReader,
  userId: string,
  roomId: string,
) {
  return db
    .query("roomMembers")
    .withIndex("by_user_room", (q) =>
      q.eq("user_id", userId).eq("room_id", roomId),
    )
    .first();
}

// to update conversation metadata after a message changes (last_msg, last_msg_sender, updated_at)
export async function updateConversationMetadata(
  db: DatabaseWriter,
  conversationId: string,
  conversationType: "room" | "direct",
  senderId: string,
  preview: string,
  timestamp: number,
) {
  if (conversationType === "room") {
    return;
  } else {
    const friendId = extractFriendId(conversationId, senderId);
    if (!friendId) return;

    const { mine, theirs } = await findFriendshipPair(db, senderId, friendId);

    if (mine) {
      await db.patch(mine._id, {
        last_msg: preview,
        last_msg_sender: senderId,
        updated_at: timestamp,
      });
    }
    if (theirs) {
      await db.patch(theirs._id, {
        last_msg: preview,
        last_msg_sender: senderId,
        updated_at: timestamp,
      });
    }
  }
}
