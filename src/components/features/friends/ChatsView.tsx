"use client";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { api } from "@/convex/_generated/api";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { timeAgo } from "@/lib/utils/date";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { Button } from "@/components/ui";
import { DirectChatThread } from "./DirectChatThread";

interface ChatsViewProps {
  onFindPeople: () => void;
  /** Set by the Friends tab's "Message" button — auto-opens that user's
   * thread once their conversation shows up in `listMyConversations`. */
  initialOpenUserId?: string | null;
  onConsumeInitialOpen?: () => void;
}

/**
 * Session 6b — Chats sub-view, the last of the 3 Friends sub-views.
 * `listMyConversations()` already only returns threads whose underlying
 * friendship is `"accepted"` (Session 5), so there's no extra filtering
 * needed here — anything this query returns is safe to open.
 *
 * Master-detail: list pane is always visible on desktop (md+), and a
 * selected thread shows alongside it. On mobile, selecting a conversation
 * replaces the list with the thread (DirectChatThread's back button
 * returns to the list) rather than trying to show both at once.
 */
export function ChatsView({ onFindPeople, initialOpenUserId, onConsumeInitialOpen }: ChatsViewProps) {
  const conversations = useQuery(api.friends.listMyConversations);
  const [openConversationId, setOpenConversationId] = useState<string | null>(null);

  useEffect(() => {
    if (!initialOpenUserId || !conversations) return;
    const match = conversations.find(
      (c) => c.other_user.user_id === initialOpenUserId,
    );
    if (match) {
      setOpenConversationId(match.conversation_id);
      onConsumeInitialOpen?.();
    }
  }, [initialOpenUserId, conversations, onConsumeInitialOpen]);

  const openConversation = conversations?.find(
    (c) => c.conversation_id === openConversationId,
  );

  if (conversations === undefined) {
    return (
      <div className="p-3">
        <ListSkeleton />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
        <HugeiconsIcon icon={BubbleChatIcon} className="w-10 h-10 opacity-40" />
        <p className="text-sm">No conversations yet.</p>
        <Button variant="secondary" size="sm" className="gap-1.5" onClick={onFindPeople}>
          <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" />
          Find people
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex min-h-0 overflow-hidden">
      <div
        className={`${openConversationId ? "hidden md:flex" : "flex"} w-full md:w-72 flex-none flex-col border-r border-theme-border overflow-y-auto`}
      >
        {conversations.map((conversation) => {
          const active = conversation.conversation_id === openConversationId;
          return (
            <button
              key={conversation.conversation_id}
              onClick={() => setOpenConversationId(conversation.conversation_id)}
              className={`${active ? "bg-theme-hover" : "hover:bg-theme-hover"} flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-200`}
            >
              <Image
                src={getAvatarUrl(conversation.other_user.avatar)}
                alt={conversation.other_user.username}
                width={36}
                height={36}
                unoptimized
                className="w-9 h-9 rounded-[10px] flex-none object-cover"
              />
              <div className="flex-1 min-w-0 flex flex-col">
                <span className="truncate text-white/90">
                  {conversation.other_user.username}
                </span>
                <span className="truncate text-xs text-gray-400">
                  {conversation.last_message_preview ?? "No messages yet"}
                </span>
              </div>
              <span className="flex-none text-[10px] text-gray-500">
                {timeAgo(conversation.last_message_at)}
              </span>
            </button>
          );
        })}
      </div>

      <div className={`${openConversationId ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col`}>
        {openConversation ? (
          <DirectChatThread
            key={openConversation.conversation_id}
            conversation_id={openConversation.conversation_id}
            other_user={openConversation.other_user}
            onBack={() => setOpenConversationId(null)}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <HugeiconsIcon icon={BubbleChatIcon} className="w-10 h-10 opacity-40" />
            <p className="text-sm">Select a conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ChatsView;
