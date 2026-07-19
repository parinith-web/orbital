import type { Id } from "@/convex/_generated/dataModel";
import type { User } from "./user";

export type MessageType = "text" | "image" | "video" | "file" | "system";

export type MessageSourceType = "room" | "direct";

export interface BaseMessage {
  _id: Id<"messages">;
  conversation_id: string;
  conversation_type: "room" | "direct";
  sender_id: string;
  sender_username?: string;
  sender_avatar?: string;
  content: string | null;
  file_storage_id?: Id<"_storage">;
  file_url: string | null;
  type: string | null;
  file_name: string | null;
  file_size?: number;
  _creationTime: number;
}

export interface MessageWithSender extends BaseMessage {
  sender?: User;
}

export interface SendMessageArgs {
  conversation_id: string;
  conversation_type: "room" | "direct";
  msg: string | null;
  file_storage_id?: Id<"_storage">;
  file_type: string | null;
  file_name: string | null;
  file_size?: number;
}

export interface DeleteMessageArgs {
  msg_id: Id<"messages">;
}

export interface MessageSearchResult {
  _id: Id<"messages">;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  sender?: User;
  _creationTime: number;
}

// ─── Scroll & Pagination Types ────────────────────────────────────────────────

export type WindowMode = "LIVE" | "HISTORY" | "JUMPING";

export interface SavedScrollAnchor {
  /** The first visible message element's ID at the time of save */
  firstVisibleMessageId: string | null;
  /** The offset of that message's top edge from the viewport top */
  offsetFromTop: number;
  /** The container's scrollTop at save time */
  scrollTop: number;
  /** The container's scrollHeight at save time */
  scrollHeight: number;
}

export interface UseScrollManagerOptions {
  /** Called when user scrolls near the top of the container */
  onNearTop?: () => void;
  /** Called when user scrolls near the bottom of the container (for catch-up) */
  onNearBottom?: () => void;
}
