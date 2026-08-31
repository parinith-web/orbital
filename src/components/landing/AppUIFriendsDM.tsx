"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatIcon,
  UserGroupIcon,
  UserAdd01Icon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { MessageItem } from "@/components/features/messaging/MessageItem";
import { ChatInputBarMock } from "@/components/mocks";
import { getAvatarUrl } from "@/lib/utils/avatar";
import type { MessageWithSender, User } from "@/lib/types";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * This panel doesn't call Convex — no signed-in session on the marketing
 * page — so it recreates the real Friends screen
 * (`app/orbital/(main)/friends/page.tsx` → `ChatsView` → `DirectChatThread`)
 * as a static replica: the same Chats/Friends/Requests/Find people tab
 * strip, `ChatsView`'s own conversation-list row markup fed a couple of
 * demo conversations, and the real, unmodified `MessageItem` bubble
 * component fed a longer static thread instead of a live query — same
 * pattern `AppUICalls`/`AppUIRooms` use for their own real components.
 */

const SUB_TABS = [
  { key: "chats", label: "Chats", icon: BubbleChatIcon, count: 0 },
  { key: "friends", label: "Friends", icon: UserGroupIcon, count: 2 },
  { key: "requests", label: "Requests", icon: UserAdd01Icon, count: 0 },
  { key: "find-people", label: "Find people", icon: Search01Icon, count: 0 },
] as const;

const DEMO_USER: User = { user_id: "demo-self", username: "You" };
const DEMO_FRIEND = { user_id: "f-otus", username: "otus", avatar: "/assets/ch.png" };

const CONVERSATIONS = [
  { id: "demo-convo", username: "otus", avatar: "/assets/ch.png", preview: "hii", time: "5d", active: true },
  { id: "demo-convo-2", username: "Minee", avatar: "/assets/bu.png", preview: "No messages yet", time: "8d", active: false },
];

const baseTime = Date.UTC(2026, 7, 25, 10, 15);

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
    content: "yeah I'm free after 6",
    file_url: null,
    type: "text",
    file_name: null,
    _creationTime: baseTime + 1000 * 60 * 5,
    sender: DEMO_USER,
  },
  {
    _id: "demo-msg-3" as unknown as Id<"messages">,
    conversation_id: "demo-convo",
    conversation_type: "direct",
    sender_id: DEMO_FRIEND.user_id,
    content: "hloo",
    file_url: null,
    type: "text",
    file_name: null,
    _creationTime: Date.UTC(2026, 7, 25, 13, 54),
    sender: { user_id: DEMO_FRIEND.user_id, username: DEMO_FRIEND.username, avatar: DEMO_FRIEND.avatar },
  },
];

export function AppUIFriendsDM({ className }: { className?: string }) {
  return (
    <div className={`flex h-full w-full flex-col ${className || ""}`}>
      {/* The real Friends page's own sub-tab strip — only "Chats" active */}
      <div className="flex flex-none items-center gap-1 border-b border-theme-border bg-theme-surface px-3 pt-2">
        {SUB_TABS.map((tab) => {
          const active = tab.key === "chats";
          return (
            <div
              key={tab.key}
              className={`flex items-center gap-1.5 rounded-t-xl border-b-2 px-3 py-1.5 text-xs transition-colors ${
                active ? "border-theme-accent text-white" : "border-transparent text-gray-400"
              }`}
            >
              <HugeiconsIcon icon={tab.icon} className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className="flex h-[16px] min-w-[16px] flex-none items-center justify-center rounded-full bg-theme-border px-1 text-[9px] text-white/70">
                  {tab.count}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* ChatsView's own conversation-list row markup */}
        <div className="hidden w-48 flex-none flex-col overflow-y-auto border-r border-theme-border sm:flex">
          {CONVERSATIONS.map((c) => (
            <div
              key={c.id}
              className={`${c.active ? "bg-theme-hover" : ""} flex items-center gap-2.5 px-3 py-2.5 text-left`}
            >
              <Image
                src={getAvatarUrl(c.avatar)}
                alt={c.username}
                width={32}
                height={32}
                unoptimized
                className="h-8 w-8 flex-none rounded-[10px] object-cover"
              />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-xs text-white/90">{c.username}</span>
                <span className="truncate text-[10px] text-gray-400">{c.preview}</span>
              </div>
              <span className="flex-none text-[9px] text-gray-500">{c.time}</span>
            </div>
          ))}
        </div>

        {/* DirectChatThread's own header + message list markup */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex h-12 flex-none items-center gap-2 border-b border-theme-border px-3">
            <Image
              src={getAvatarUrl(DEMO_FRIEND.avatar)}
              alt={DEMO_FRIEND.username}
              width={28}
              height={28}
              unoptimized
              className="h-7 w-7 flex-none rounded-[8px] object-cover"
            />
            <span className="truncate text-white/90">{DEMO_FRIEND.username}</span>
          </div>

          <div className="flex-1 overflow-y-auto py-2">
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
    </div>
  );
}

export default AppUIFriendsDM;
