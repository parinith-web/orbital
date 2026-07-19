import type { Id } from "@/convex/_generated/dataModel";
import type { MessageSourceType } from "./message";

export interface Notification {
  _id: Id<"chatNotifications">;
  user_id: string;
  message_id: string;
  source_type: MessageSourceType;
  source_id: string;
  source_name: string;
  sender_id: string;
  sender_name: string;
  sender_avatar?: string;
  message: string;
  read_at?: number;
  _creationTime: number;
}

export interface NotificationItem {
  id: Id<"chatNotifications">;
  messageId: string;
  sourceType: MessageSourceType;
  sourceId: string;
  sourceName: string;
  senderName: string;
  senderAvatar?: string;
  message: string;
  createdAt: number;
  readAt?: number;
  isRead: boolean;
}

export type { MessageSourceType };
