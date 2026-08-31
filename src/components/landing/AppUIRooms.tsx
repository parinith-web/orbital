"use client";

import { useState } from "react";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Image01Icon,
  CallIcon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons";
import { RoomAvatar } from "@/components/ui/RoomAvatar";
import { RoomMembersList } from "@/components/features/rooms/RoomMembersList";
import { MessageItem } from "@/components/features/messaging/MessageItem";
import AvatarStack from "@/components/ui/AvatarStack";
import { Button } from "@/components/ui";
import type { RoomMemberWithUser, User, MessageWithSender } from "@/lib/types";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * This panel doesn't call Convex — it's the marketing page, no session to
 * query against — so it recreates the real room screen (`PlainRoomLayout`
 * → `TopBar` + `RoomChatUI` + `DetailsSidebar`) as a static replica:
 * `TopBar`'s exact Media/Calls/Info tab-icon markup drives which detail
 * panel shows on the right, and the real `RoomMembersList` and
 * `MessageItem` components are fed static demo data, same pattern as
 * `AppUICalls`/`AppUIFriendsDM`.
 */

type DetailTab = "info" | "media" | "calls";

const DEMO_USER: User = { user_id: "demo-self", username: "You" };

const DEMO_MEMBERS: RoomMemberWithUser[] = [
  {
    room_id: "demo-room",
    user_id: "f-wave",
    role: "Owner",
    Users: { user_id: "f-wave", username: "Wave", avatar: "/assets/sq.png" },
  },
  {
    room_id: "demo-room",
    user_id: "f-ember",
    role: "Member",
    Users: { user_id: "f-ember", username: "Ember", avatar: "/assets/ch.png" },
  },
  {
    room_id: "demo-room",
    user_id: "f-volt",
    role: "Member",
    Users: { user_id: "f-volt", username: "Volt", avatar: "/assets/pi.png" },
  },
];

const ONLINE_USERS = new Set(["f-wave", "f-ember", "f-volt"]);

const CALL_HISTORY_USERS = [
  { user_id: "f-wave", username: "Wave", avatar: "/assets/sq.png" },
  { user_id: "f-ember", username: "Ember", avatar: "/assets/ch.png" },
  { user_id: "f-volt", username: "Volt", avatar: "/assets/pi.png" },
];

const GALLERY_IMAGES = ["/assets/sq.png", "/assets/ch.png", "/assets/pi.png", "/assets/bu.png"];

const chatBaseTime = Date.UTC(2026, 7, 29, 18, 40);

const DEMO_CHAT: MessageWithSender[] = [
  {
    _id: "demo-room-msg-1" as unknown as Id<"messages">,
    conversation_id: "demo-room",
    conversation_type: "room",
    sender_id: "f-wave",
    content: "anyone free for anomaly tonight?",
    file_url: null,
    type: "text",
    file_name: null,
    _creationTime: chatBaseTime,
    sender: { user_id: "f-wave", username: "Wave", avatar: "/assets/sq.png" },
  },
  {
    _id: "demo-room-msg-2" as unknown as Id<"messages">,
    conversation_id: "demo-room",
    conversation_type: "room",
    sender_id: "f-ember",
    content: "yeah I'm down, 9pm?",
    file_url: null,
    type: "text",
    file_name: null,
    _creationTime: chatBaseTime + 1000 * 60 * 3,
    sender: { user_id: "f-ember", username: "Ember", avatar: "/assets/ch.png" },
  },
  {
    _id: "demo-room-msg-3" as unknown as Id<"messages">,
    conversation_id: "demo-room",
    conversation_type: "room",
    sender_id: DEMO_USER.user_id,
    content: "works for me, I'll start the room",
    file_url: null,
    type: "text",
    file_name: null,
    _creationTime: chatBaseTime + 1000 * 60 * 5,
    sender: DEMO_USER,
  },
];

const TABS: { key: DetailTab; label: string; icon: typeof Image01Icon }[] = [
  { key: "media", label: "Media Gallery", icon: Image01Icon },
  { key: "calls", label: "Calls", icon: CallIcon },
  { key: "info", label: "Room Information", icon: InformationCircleIcon },
];

function InfoTab() {
  return (
    <div className="flex h-full flex-col gap-2 p-2">
      <span className="px-1 pb-1 text-left text-[11px] uppercase tracking-wide text-white/40">
        Members
      </span>
      <div className="min-h-0 flex-1 overflow-hidden">
        <RoomMembersList
          members={DEMO_MEMBERS}
          memberCount={DEMO_MEMBERS.length}
          onlineUsers={ONLINE_USERS}
          awayUsers={new Set()}
          user={DEMO_USER}
        />
      </div>
    </div>
  );
}

function MediaTab() {
  return (
    <div className="flex h-full flex-col gap-2 p-3">
      <span className="text-[11px] uppercase tracking-wide text-white/40">Images</span>
      <div className="grid grid-cols-2 gap-2">
        {GALLERY_IMAGES.map((src) => (
          <div key={src} className="aspect-square overflow-hidden rounded-lg bg-theme-hover">
            <Image src={src} alt="" width={120} height={120} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CallsTab() {
  return (
    <div className="flex h-full flex-col p-3">
      <div className="rounded-xl border border-theme-border/50 px-2 py-3">
        <span className="px-1 text-xs font-bold text-gray-500">Today</span>
        <div className="mt-2 px-1">
          <AvatarStack users={CALL_HISTORY_USERS} size={24} showCount />
          <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
            8:52 PM <span>• 24m</span>
          </div>
        </div>
      </div>
      <div className="mt-auto pt-3">
        <Button variant="other" className="w-full">
          <HugeiconsIcon icon={CallIcon} className="mr-2 h-4 w-4" />
          Start New Call
        </Button>
      </div>
    </div>
  );
}

export function AppUIRooms({ className }: { className?: string }) {
  const [tab, setTab] = useState<DetailTab>("info");

  return (
    <div className={`flex h-full w-full flex-col ${className || ""}`}>
      {/* TopBar's real room header + tab-icon markup */}
      <div className="flex h-14 flex-none items-center gap-3 border-b border-theme-border px-4">
        <RoomAvatar name="Projects" className="h-8 w-8 flex-none" />
        <div className="flex min-w-0 flex-col leading-tight">
          <span className="truncate text-sm text-white/90">Projects</span>
          <span className="text-xs text-gray-400">ID: 4369</span>
        </div>

        <div className="ml-auto flex items-center gap-1">
          {TABS.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                title={t.label}
                className={`flex h-8 w-8 flex-none select-none items-center justify-center rounded-xl transition-colors ${
                  active ? "bg-theme-hover" : "hover:bg-theme-hover"
                }`}
              >
                <HugeiconsIcon
                  icon={t.icon}
                  className={`h-4 w-4 transition-colors ${active ? "text-white" : "text-gray-300"}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Chat column */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden py-2">
            {DEMO_CHAT.map((message, i) => (
              <MessageItem
                key={message._id as string}
                message={message}
                prevMessage={DEMO_CHAT[i - 1] ?? null}
                nextMessage={DEMO_CHAT[i + 1] ?? null}
                user={DEMO_USER}
                isCurrentUser={message.sender_id === DEMO_USER.user_id}
                color=""
                textColor="#ffffff"
                onPreviewMedia={() => {}}
                onDeleteRequest={() => {}}
              />
            ))}
          </div>
        </div>

        {/* Detail sidebar — switches with the tab icons above, same as
            the real app's DetailsSidebar */}
        <div className="hidden w-64 flex-none border-l border-theme-border bg-theme-surface sm:block">
          {tab === "info" && <InfoTab />}
          {tab === "media" && <MediaTab />}
          {tab === "calls" && <CallsTab />}
        </div>
      </div>
    </div>
  );
}

export default AppUIRooms;
