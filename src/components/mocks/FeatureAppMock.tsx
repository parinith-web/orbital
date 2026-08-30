"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldKeyIcon,
  FingerAccessIcon,
  Settings02Icon,
  Notification03Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { ParticipantCardMock } from "./ParticipantCardMock";
import { CallControlsMock } from "./CallControlsMock";
import { ProfileButtonMock } from "./ProfileButtonMock";
import { AvatarStatusMock } from "./AvatarStatusMock";
import { AnomalyGameMock } from "./AnomalyGameMock";
import { AppUIFriendsRooms } from "@/components/landing/AppUIFriendsRooms";

/** A little "everything is fine here" badge reused across a couple of the
 * feature panels below. */
function StatusBadge({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full border border-[#242424] bg-[#101010] px-3 py-1 text-[11px] font-medium text-emerald-400">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
      {label}
    </div>
  );
}

function CallsPanel() {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-1.5 rounded-full border border-[#242424] bg-[#101010] px-3 py-1 text-[11px] font-medium text-arcade-yellow">
        <HugeiconsIcon icon={ShieldKeyIcon} className="h-3.5 w-3.5" />
        End-to-end encrypted
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <ParticipantCardMock className="h-28 w-36 sm:h-36 sm:w-44" />
        <ParticipantCardMock className="h-28 w-36 sm:h-36 sm:w-44" />
      </div>
      <CallControlsMock />
    </div>
  );
}

function SignInPanel() {
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <AvatarStatusMock className="w-fit" />
      <StatusBadge label="Verified device" />
      <div className="flex items-center gap-2 rounded-xl border border-[#242424] bg-[#101010] px-4 py-2.5 text-xs text-white/70">
        <HugeiconsIcon icon={FingerAccessIcon} className="h-4 w-4 text-white/70" />
        Passkey sign-in enabled — no password stored, anywhere.
      </div>
      <ProfileButtonMock name="Wave" avatar="/assets/sq.png" />
    </div>
  );
}

function AccountPanel() {
  const rows = [
    { label: "Two-factor authentication", value: "On" },
    { label: "Active sessions", value: "1 device" },
    { label: "Data export", value: "Available anytime" },
  ];
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <ProfileButtonMock name="Ember" avatar="/assets/ch.png" />
      <div className="w-full max-w-[280px] rounded-xl border border-[#242424] bg-[#101010] p-1">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs text-white/70"
          >
            <span className="flex items-center gap-2">
              <HugeiconsIcon icon={Settings02Icon} className="h-3.5 w-3.5 text-white/40" />
              {r.label}
            </span>
            <span className="font-medium text-white">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function GamePanel() {
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="flex items-center gap-1.5 rounded-full border border-[#242424] bg-[#101010] px-3 py-1 text-[11px] font-medium text-arcade-pink">
        <HugeiconsIcon icon={Notification03Icon} className="h-3.5 w-3.5" />
        Live game night
      </div>
      <AnomalyGameMock className="max-w-[360px]" />
    </div>
  );
}

function SocialPanel() {
  // The real app UI, not a mock: FriendsListView's exact row markup plus
  // the unmodified RoomMembersList component, fed static demo data since
  // there's no signed-in session on the marketing page.
  return <AppUIFriendsRooms />;
}

const panels = [CallsPanel, SignInPanel, AccountPanel, GamePanel, SocialPanel];

export function FeatureAppMock({
  active,
  className,
}: {
  active: number;
  className?: string;
}) {
  const ActivePanel = panels[active] ?? panels[0];

  return (
    <div
      className={`arcade-outline arcade-shadow arcade-shadow-blue relative w-full max-w-2xl overflow-hidden rounded-2xl bg-[#0a080b] ${className || ""}`}
    >
      {/* mini browser-style chrome, echoing the arcade cabinet theme */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-[#101014] px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-[#FF3D8A]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#FFD23F]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#38D66B]" />
        <span className="ml-3 flex items-center gap-1.5 text-[11px] text-white/40">
          <HugeiconsIcon icon={UserGroupIcon} className="h-3 w-3" />
          orbital.app
        </span>
      </div>

      <div className="flex min-h-[300px] items-center justify-center overflow-hidden p-6 sm:min-h-[340px] sm:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex w-full items-center justify-center"
          >
            <ActivePanel />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
