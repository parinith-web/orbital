import { DatabaseWriter } from "../_generated/server";
import { parseDirectConversationId } from "./friends";

const PREVIEW_MAX_LENGTH = 100;

// to make a preview from content or filename
export function toPreview(
  content: string | null,
  fileName: string | null,
): string {
  return (content || fileName || "Attachment").slice(0, PREVIEW_MAX_LENGTH);
}

// to update conversation metadata after a message changes (last_msg, last_msg_sender, updated_at)
//
// Only direct conversations carry a last-message preview on their own doc
// (the `conversations` table from schema.ts) — rooms don't store one on
// the room doc itself — so this only has work to do for
// conversation_type === "direct".
export async function updateConversationMetadata(
  db: DatabaseWriter,
  conversationId: string,
  conversationType: "room" | "direct",
  _senderId: string,
  preview: string,
  timestamp: number,
) {
  if (conversationType !== "direct") return;

  const pair = parseDirectConversationId(conversationId);
  if (!pair) return; // not a well-formed direct conversation id; nothing to update

  const [userIdA, userIdB] = pair;
  const conversation = await db
    .query("conversations")
    .withIndex("by_pair", (q) => q.eq("user_id_a", userIdA).eq("user_id_b", userIdB))
    .first();

  // The conversations row is created by acceptFriendsRow (friends.ts) once
  // a request is accepted, so it should already exist by the time anyone
  // can send here — sendMessage's accepted-only guard runs first. If it's
  // somehow missing, there's nothing safe to patch; the guard already
  // prevents that path in practice.
  if (!conversation) return;

  await db.patch(conversation._id, {
    last_message_preview: preview,
    last_message_at: timestamp,
  });
}
