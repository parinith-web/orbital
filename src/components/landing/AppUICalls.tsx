"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ShieldKeyIcon, BubbleChatIcon, Menu01Icon } from "@hugeicons/core-free-icons";
import { LandingParticipantTile } from "@/components/landing/LandingParticipantTile";
import { CallControls } from "@/components/features/calls/CallControls";
import { MessageItem } from "@/components/features/messaging/MessageItem";
import type { MessageWithSender, User } from "@/lib/types";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * `LandingParticipantTile` is a landing-page-only presentational tile
 * (square avatar, whole-tile speaking outline) — intentionally separate
 * from the real, shared `ParticipantCard` so this marketing redesign never
 * touches the live call feature. `CallControls` reads `useCallStore`
 * directly, but with no active call its mute/video buttons just flip local
 * UI state and its leave button no-ops on a missing `callId` — safe to
 * mount live, no wrapping needed.
 *
 * The chat column on the right is `ChatPanel.tsx`'s real header markup
 * (`BubbleChatIcon` + title + kebab, `h-14 border-b`) plus the real
 * `MessageItem` bubble component, fed static demo messages the same way
 * `AppUIFriendsDM` does — no live session on the marketing page.
 */

const PARTICIPANTS = [
  { userId: "demo-wave", username: "Wave", avatar: "/assets/sq.png", isSpeaking: true },
  { userId: "demo-volt", username: "Volt", avatar: "/assets/pi.png", isMuted: true },
  { userId: "demo-ember", username: "Ember", avatar: "/assets/ch.png" },
  { userId: "demo-nova", username: "Nova", avatar: "/assets/bu.png" },
];

const DEMO_USER: User = { user_id: "demo-self", username: "You" };
const baseTime = Date.UTC(2026, 7, 28, 20, 10);

const DEMO_MESSAGES: MessageWithSender[] = [
  {
    _id: "demo-call-msg-1" as unknown as Id<"messages">,
    conversation_id: "demo-group",
    conversation_type: "direct",
    sender_id: "demo-wave",
    content: "queueing up ranked, who's in?",
    file_url: null,
    type: "text",
    file_name: null,
    _creationTime: baseTime,
    sender: { user_id: "demo-wave", username: "Wave", avatar: "/assets/sq.png" },
  },
  {
    _id: "demo-call-msg-2" as unknown as Id<"messages">,
    conversation_id: "demo-group",
    conversation_type: "direct",
    sender_id: "demo-ember",
    content: "in, give me 2 min",
    file_url: null,
    type: "text",
    file_name: null,
    _creationTime: baseTime + 1000 * 60 * 2,
    sender: { user_id: "demo-ember", username: "Ember", avatar: "/assets/ch.png" },
  },
  {
    _id: "demo-call-msg-3" as unknown as Id<"messages">,
    conversation_id: "demo-group",
    conversation_type: "direct",
    sender_id: DEMO_USER.user_id,
    content: "same, jumping on now",
    file_url: null,
    type: "text",
    file_name: null,
    _creationTime: baseTime + 1000 * 60 * 3,
    sender: DEMO_USER,
  },
];

export function AppUICalls({ className }: { className?: string }) {
  return (
    <div className={`flex h-full w-full ${className || ""}`}>
      {/* Call column */}
      <div className="flex min-w-0 flex-1 flex-col items-center gap-3 overflow-hidden p-4 sm:p-6">
        <div className="flex items-center gap-1.5 rounded-full border border-[#242424] bg-[#101010] px-3 py-1 text-[11px] font-medium text-arcade-yellow">
          <HugeiconsIcon icon={ShieldKeyIcon} className="h-3.5 w-3.5" />
          End-to-end encrypted
        </div>

        <div className="flex w-full max-w-md flex-1 flex-col overflow-hidden rounded-2xl border border-theme-border bg-theme-base">
          <div className="grid grid-cols-2 gap-2 p-3">
            {PARTICIPANTS.map((p) => (
              <div key={p.userId} className="aspect-[4/3]">
                <LandingParticipantTile
                  username={p.username}
                  avatar={p.avatar}
                  isMuted={!!p.isMuted}
                  isSpeaking={!!p.isSpeaking}
                />
              </div>
            ))}
          </div>
          <CallControls />
        </div>
      </div>

      {/* Group chat column — ChatPanel.tsx's real header markup */}
      <div className="hidden w-80 flex-none flex-col border-l border-theme-border bg-theme-surface sm:flex">
        <div className="flex h-14 flex-none items-center justify-between gap-2 border-b border-theme-border px-4">
          <div className="flex min-w-0 items-center gap-2">
            <HugeiconsIcon icon={BubbleChatIcon} className="h-4 w-4 flex-none text-theme-accent" />
            <span className="truncate text-xs font-semibold tracking-wide text-white">
              Squad Chat
            </span>
          </div>
          <HugeiconsIcon icon={Menu01Icon} className="h-4 w-4 flex-none text-white/60" />
        </div>

        <div className="flex-1 overflow-hidden py-2">
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
      </div>
    </div>
  );
}

export default AppUICalls;
