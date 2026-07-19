import type { User } from "@/lib/types";

export interface MessageListProps {
  conversationId: string;
  conversationType: "room" | "direct";
  initialMessageId?: string;
  typingUsers: { username: string }[];
  user: User | null;
  color: string;
  textColor: string;
  onDeleteRequest: (id: string) => void;
  /** Numeric trigger — incremented by parent to force return-to-live + scroll-to-bottom */
  returnToLiveTrigger: number;
}
