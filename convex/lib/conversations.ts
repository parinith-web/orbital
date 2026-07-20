import { DatabaseWriter } from "../_generated/server";

const PREVIEW_MAX_LENGTH = 100;

// to make a preview from content or filename
export function toPreview(
  content: string | null,
  fileName: string | null,
): string {
  return (content || fileName || "Attachment").slice(0, PREVIEW_MAX_LENGTH);
}

// to update conversation metadata after a message changes (last_msg, last_msg_sender, updated_at)
// H4: DMs (and the `friends` table they lived on) are gone, so this is now
// a no-op — kept in place so messages.ts's call sites don't need to change
// shape. Rooms never carried a last_msg preview on the room doc itself
// (only the old friends-table DMs did), so there's nothing left to update.
export async function updateConversationMetadata(
  _db: DatabaseWriter,
  _conversationId: string,
  _conversationType: "room" | "direct",
  _senderId: string,
  _preview: string,
  _timestamp: number,
) {
  return;
}
