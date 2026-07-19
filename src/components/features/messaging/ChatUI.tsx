import React, { useState, useEffect, useCallback } from "react";
import { MessageList } from "./MessageList";
import { ChatInputBar } from "./ChatInputBar";
import {
  useTypingIndicators,
} from "@/hooks/useMessageActions";
import type { User } from "@/lib/types";
import { MediaLightbox } from "@/components/ui/MediaLightbox";

interface ChatUIProps {
  type: "room" | "direct";
  room_id: string;
  user: User | null;
  color: string;
  textColor: string;
  onDeleteRequest: (messageId: string) => void;
  /** Optional message ID to jump to on mount (from search results or linked messages) */
  initialMessageId?: string;
}

export function ChatUI({
  type,
  room_id,
  user,
  color,
  textColor,
  onDeleteRequest,
  initialMessageId,
}: ChatUIProps) {
  // ── Return-to-live trigger ────────────────────────────────────────────
  // Incremented when the user sends a message via ChatInputBar. MessageList
  // watches this number and returns to LIVE mode + scrolls to bottom.
  const [returnToLiveTrigger, setReturnToLiveTrigger] = useState(0);

  const { typingUsers } = useTypingIndicators(room_id);

  const handleScrollToBottomRequest = useCallback(() => {
    setReturnToLiveTrigger((previous) => previous + 1);
  }, []);

  return (
    <div className="flex flex-col w-full h-full overflow-hidden">
      <MediaLightbox />

      <div className="flex-1 relative min-h-0 overflow-hidden">
        <MessageList
          conversationId={room_id}
          conversationType={type}
          initialMessageId={initialMessageId}
          typingUsers={typingUsers}
          user={user}
          color={color}
          textColor={textColor}
          onDeleteRequest={onDeleteRequest}
          returnToLiveTrigger={returnToLiveTrigger}
        />
      </div>

      <div className="flex-shrink-0 w-full flex justify-center pb-4 pt-0 px-4">
        <ChatInputBar
          room_id={room_id}
          type={type}
          color={color}
          textColor={textColor}
          scrollToBottom={handleScrollToBottomRequest}
        />
      </div>
    </div>
  );
}

export default ChatUI;
