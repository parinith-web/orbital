"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon, UserGroupIcon, HashtagIcon, Settings01Icon } from "@hugeicons/core-free-icons";
import { ProfileButton } from "@/components/features/profile/ProfileButton";
import type { User } from "@/lib/types";

/**
 * This is the app's real shell, not a browser-window mock: the nav items,
 * labels, icons, active-state styling, and footer are `LeftSidebar`'s own
 * markup verbatim (see LeftSidebar.tsx) minus the routing/Convex/auth
 * wiring, since there's no signed-in session on the marketing page — the
 * `activeNav` prop stands in for the pathname match `LeftSidebar` normally
 * does. The footer uses the real, unmodified `ProfileButton` component
 * fed a demo user.
 */

type NavKey = "game-hub" | "friends" | "rooms" | "settings";

const NAV_ITEMS: { key: NavKey; label: string; icon: typeof Home01Icon }[] = [
  { key: "game-hub", label: "Game Hub", icon: Home01Icon },
  { key: "friends", label: "Social", icon: UserGroupIcon },
  { key: "rooms", label: "Rooms", icon: HashtagIcon },
  { key: "settings", label: "Settings", icon: Settings01Icon },
];

const DEMO_USER: User = {
  user_id: "demo-self-user-id",
  username: "otus",
  avatar: "/assets/ch.png",
};

export function AppShellFrame({
  activeNav,
  children,
  className,
}: {
  activeNav: NavKey;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`arcade-outline arcade-shadow flex w-full max-w-5xl overflow-hidden rounded-2xl bg-theme-base ${className || ""}`}
    >
      {/* LeftSidebar's exact signed-in markup */}
      <div className="bg-theme-surface border-theme-border border-r select-none flex flex-col py-2 px-1 text-white items-center font-sans flex-none">
        <div className="flex flex-col gap-1 mt-2 text-sm items-center">
          {NAV_ITEMS.map((item) => {
            const active = item.key === activeNav;
            return (
              <div
                key={item.key}
                className={`${active ? "bg-theme-hover text-white" : "bg-theme-surface text-gray-200"} flex items-center px-3 gap-2 w-32 sm:w-56 py-2 rounded-[8px]`}
              >
                <HugeiconsIcon icon={item.icon} className="w-4 h-4 flex-none" />
                <span className="truncate">{item.label}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-auto w-full flex flex-col gap-2 p-1 bg-theme-surface/50">
          <ProfileButton user={DEMO_USER} awayUsers={new Set()} />
        </div>
      </div>

      {/* Fixed-size content slot: every panel renders inside this same
          box, so switching features never resizes the card. Panels that
          need to fill it (the room detail view, the call+chat layout) use
          h-full w-full; simpler panels just center within it. */}
      <div className="flex-1 min-w-0 h-[440px] sm:h-[500px] overflow-hidden flex items-stretch justify-center">
        {children}
      </div>
    </div>
  );
}

export default AppShellFrame;
