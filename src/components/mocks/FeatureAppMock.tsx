"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AppShellFrame } from "@/components/landing/AppShellFrame";
import { AppUICalls } from "@/components/landing/AppUICalls";
import { AppUIRooms } from "@/components/landing/AppUIRooms";
import { AppUIGameNight } from "@/components/landing/AppUIGameNight";
import { AppUIFriendsDM } from "@/components/landing/AppUIFriendsDM";

const panels = [
  { activeNav: "rooms" as const, Panel: AppUICalls },
  { activeNav: "rooms" as const, Panel: AppUIRooms },
  { activeNav: "game-hub" as const, Panel: AppUIGameNight },
  { activeNav: "friends" as const, Panel: AppUIFriendsDM },
];

export function FeatureAppMock({
  active,
  className,
}: {
  active: number;
  className?: string;
}) {
  const { activeNav, Panel } = panels[active] ?? panels[0];

  return (
    <AppShellFrame activeNav={activeNav} className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="flex w-full items-center justify-center"
        >
          <Panel />
        </motion.div>
      </AnimatePresence>
    </AppShellFrame>
  );
}

