"use client";

import Image from "next/image";
import { MessageItem } from "@/components/features/messaging/MessageItem";
import { ChatInputBarMock } from "@/components/mocks";
import { getAvatarUrl } from "@/lib/utils/avatar";
import type { MessageWithSender, User } from "@/lib/types";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * This panel doesn't call Convex — no signed-in session on the marketing
 * page — so it feeds the real, unmodified `MessageItem` bubble component
 * (the exact row markup `DirectChatThread`/`MessageList` render per
 * message) static demo messages instead of a live query, same as
 * `AppUICalls`/`AppUIRooms` do for their own real components. The header
 * row below is `DirectChatThread`'s own markup verbatim.
 */

const DEMO_USER: User = { user_id: "demo-self", username: "You" };
const DEMO_FRIEND = { user_id: "f-otus", username: "otus", avatar: "/assets/ch.png" };

const baseTime = Date.UTC(2026, 7, 25, 13, 54);

const DEMO_MESSAGES: MessageWithSender[] = [
  {
    _id: "demo-msg-1" as unknown as Id<"messages">,
    conversation_id: "demo-convo",
    conversation_type: "direct",
    sender_id: DEMO_FRIEND.user_id,
    content: "hey! you around for game night later?",
    file_url: null,
    type: "text",
    file_name: null,
    _creationTime: baseTime,
    sender: { user_id: DEMO_FRIEND.user_id, username: DEMO_FRIEND.username, avatar: DEMO_FRIEND.avatar },
  },
  {
    _id: "demo-msg-2" as unknown as Id<"messages">,
    conversation_id: "demo-convo",
    conversation_type: "direct",
    sender_id: DEMO_USER.user_id,
    content: "always. I'll get a room going",
    file_url: null,
    type: "text",
    file_name: null,
    _creationTime: baseTime + 1000 * 60 * 6,
    sender: DEMO_USER,
  },
];

export function AppUIFriendsDM({ className }: { className?: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center p-6 ${className || ""}`}>
    <div
      className="flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-theme-border bg-theme-base"
    >
      {/* DirectChatThread's own header markup, verbatim */}
      <div className="flex-none flex items-center gap-2 px-3 h-12 border-b border-theme-border">
        <Image
          src={getAvatarUrl(DEMO_FRIEND.avatar)}
          alt={DEMO_FRIEND.username}
          width={28}
          height={28}
          unoptimized
          className="w-7 h-7 rounded-[8px] flex-none object-cover"
        />
        <span className="truncate text-white/90">{DEMO_FRIEND.username}</span>
      </div>

      <div className="flex flex-col py-2">
        {DEMO_MESSAGES.map((message, i) => (
          <MessageItem
            key={message._id as string}
            message={message}
            prevMessage={DEMO_MESSAGES[i - 1] ?? null}
            nextMessage={DEMO_MESSAGES[i + 1] ?? null}
            user={DEMO_USER}
            isCurrentUser={message.sender_id === DEMO_USER.user_id}
            color=""
            textColor="#ffffff"
            onPreviewMedia={() => {}}
            onDeleteRequest={() => {}}
          />
        ))}
      </div>

      <div className="flex-none w-full flex justify-center pb-3 pt-1 px-3">
        <ChatInputBarMock className="w-full md:max-w-full" />
      </div>
    </div>
    </div>
  );
}

export default AppUIFriendsDM;
