"use client";

import { AnimatePresence, motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { AppUICalls } from "@/components/landing/AppUICalls";
import { AppUISignIn } from "@/components/landing/AppUISignIn";
import { AppUIAccount } from "@/components/landing/AppUIAccount";
import { AppUIGameNight } from "@/components/landing/AppUIGameNight";
import { AppUIFriendsRooms } from "@/components/landing/AppUIFriendsRooms";

function CallsPanel() {
  return <AppUICalls />;
}

function SignInPanel() {
  return <AppUISignIn />;
}

function AccountPanel() {
  return <AppUIAccount />;
}

function GamePanel() {
  return <AppUIGameNight />;
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
