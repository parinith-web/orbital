import type { MessageWithSender } from "@/lib/types";
import { isSameDay, isSameMinute } from "./date";

export function shouldShowDateDivider(
  currentMsg: MessageWithSender | undefined,
  previousMsg: MessageWithSender | null,
): boolean {
  if (!previousMsg) return true;
  return !isSameDay(currentMsg?._creationTime, previousMsg._creationTime);
}

export function shouldShowMeta(
  currentMsg: MessageWithSender | undefined,
  previousMsg: MessageWithSender | null,
): boolean {
  if (!previousMsg) return true;

  if (currentMsg?.type === "system" || previousMsg.type === "system") {
    return true;
  }
  if (currentMsg?.sender_id !== previousMsg.sender_id) return true;

  return !isSameMinute(currentMsg?._creationTime, previousMsg._creationTime);
}

export function isImageMessage(type: string | null | undefined): boolean {
  return type?.startsWith("image/") ?? false;
}

export function isVideoMessage(type: string | null | undefined): boolean {
  return type?.startsWith("video/") ?? false;
}

export function isFileMessage(
  fileUrl: string | null,
  type: string | null | undefined,
): boolean {
  return !!fileUrl && !isImageMessage(type) && !isVideoMessage(type);
}

export function getMessagePreview(message: {
  content: string | null;
  file_name: string | null;
}): string {
  if (message.content) return message.content;
  if (message.file_name) return `Attachment: ${message.file_name}`;
  return "Attachment";
}

export function getDirectConversationId(
  userId1: string,
  userId2: string,
): string {
  const sorted = [userId1, userId2].sort();
  return `direct_${sorted[0]}_${sorted[1]}`;
}

const EMOJI_REGEX = /^(\p{Extended_Pictographic}|\p{Emoji_Component})+$/u;

export function isOnlyEmojis(text: string | null | undefined): boolean {
  if (!text || text.length > 64) return false; // Early exit for long strings
  const noWhitespace = text.replace(/\s/g, "");
  if (noWhitespace.length === 0) return false;

  // Uses pre-compiled Regex with Unicode property escapes
  return EMOJI_REGEX.test(noWhitespace);
}
