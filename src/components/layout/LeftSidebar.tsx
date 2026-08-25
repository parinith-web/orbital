"use client";
import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  UserGroupIcon,
  HashtagIcon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { useUserStore } from "@/store/useUserStore";
import { usePresence } from "@/contexts/presenceContext";
import { ProfileButton } from "@/components/features/profile/ProfileButton";
import { useUIStore } from "@/store/uiStore";
import PersistentCallWidget from "@/components/features/calls/PersistentCallWidget";
import { ROUTES } from "@/lib/constants/routes";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

/**
 * The left nav is 4 top-level destinations: Game Hub, Friends, Rooms,
 * Settings. This replaced the old game-first nav (Game Hub / Play Online
 * only, with no Friends/DMs or standalone Rooms destination). Play Online
 * isn't dropped from the app — it still lives as a tile inside the Game Hub
 * page itself (app/orbital/(main)/page.tsx), it's just no longer a top-level
 * nav item now that Friends/Rooms/Settings have taken those slots.
 *
 * Settings (`/orbital/settings`) merges what used to be two separate
 * destinations — Profile and Preferences — into one tab with an internal
 * sub-tab switcher. The old `/orbital/profile` and `/orbital/preferences`
 * routes still exist as redirects to `/orbital/settings` so old links/
 * bookmarks don't 404.
 *
 * All destinations are fully built: Friends (`/orbital/friends` — Chats,
 * Requests, Find people), Rooms (`/orbital/rooms`), and Settings
 * (`/orbital/settings` — Profile + Preferences).
 *
 * The Friends nav item also carries a small badge showing the incoming
 * pending-friend-request count (see `incomingRequestCount` below) — same
 * `listPendingRequests` query the Friends page's Requests tab uses.
 *
 * H6.3 — the `?join=` deep-link is still wired to the Join Room modal:
 * a shared link like `/orbital?join=7K4RXP` opens `JoinGameRoomModal` with
 * the code pre-filled via `setModal("JOIN_GAME_ROOM", { join_code })`,
 * which `GlobalModals.tsx` already reads from `modalData?.join_code`. The
 * param is then stripped from the URL so a refresh/back-nav doesn't reopen
 * it.
 *
 * Session 2 — join codes are an Anomaly game-room concept
 * (`gameRoomCode.joinGameRoomByCode`), so this deep link now opens
 * `JOIN_GAME_ROOM` instead of the plain-room `JOIN_ROOM` modal, which no
 * longer accepts a join code (it joins by `room_id` instead).
 */

type LeftSidebarProps = {
  className?: string;
  showOrbitalSkeletons?: boolean;
};

type NavItem = {
  key: string;
  label: string;
  route: string;
  icon: typeof Home01Icon;
  isActive: (pathname: string) => boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "game-hub",
    label: "Game Hub",
    route: ROUTES.ORBITAL,
    icon: Home01Icon,
    isActive: (pathname) => /^\/orbital$/.test(pathname),
  },
  {
    key: "friends",
    label: "Social",
    route: ROUTES.ORBITAL_FRIENDS,
    icon: UserGroupIcon,
    isActive: (pathname) => /^\/orbital\/friends/.test(pathname),
  },
  {
    key: "rooms",
    label: "Rooms",
    route: ROUTES.ORBITAL_ROOMS,
    icon: HashtagIcon,
    isActive: (pathname) => /^\/orbital\/rooms/.test(pathname),
  },
  {
    key: "settings",
    label: "Settings",
    route: ROUTES.ORBITAL_SETTINGS,
    icon: Settings01Icon,
    // Matches the old /orbital/profile and /orbital/preferences paths too,
    // so this item still highlights while those routes redirect in.
    isActive: (pathname) => /^\/orbital\/(settings|profile|preferences)/.test(pathname),
  },
];

export default function LeftSidebar({
  className = "",
  showOrbitalSkeletons = true,
}: LeftSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinParam = searchParams.get("join");
  const user = useUserStore((s) => s.user);
  const { awayUsers } = usePresence();
  const { leftMobileMenu, setLeftMobileMenu, setModal } = useUIStore();
  const pendingRequests = useQuery(
    api.friends.listPendingRequests,
    user?.user_id ? {} : "skip",
  );
  const incomingRequestCount = pendingRequests?.incoming.length ?? 0;

  // H6.3 — a shared `/orbital?join=CODE` link opens Join Room with the code
  // pre-filled, then drops the param from the URL so the modal doesn't
  // reopen on refresh/back-nav. Only fires once user auth has resolved
  // (mirrors the rest of this component gating on `user?.user_id`) so an
  // unauthenticated visitor lands on the normal auth flow first rather than
  // popping a modal behind Clerk's redirect.
  useEffect(() => {
    if (joinParam && user?.user_id) {
      setModal("JOIN_GAME_ROOM", { join_code: joinParam.toUpperCase() });
      router.replace(pathname);
    }
  }, [joinParam, pathname, router, setModal, user?.user_id]);

  return (
    <>
      <div>
        <div
          className={`bg-theme-surface ${className} md:translate-y-0 translate-y-12 fixed md:static top-0 left-0 md:h-screen h-[calc(100dvh-40px)]
    border-theme-border border-r select-none transition-transform duration-300
    flex flex-col py-2 px-1 md:px-1 text-white items-center font-sans z-[1500]
    ${leftMobileMenu ? "translate-x-0" : "-translate-x-full"}
    md:translate-x-0`}
        >
          {!user?.user_id ? (
            <div className="flex flex-col gap-1 mt-2 text-sm items-center">
              {NAV_ITEMS.map((item) => (
                <div
                  key={item.key}
                  className="ease-in-out bg-theme-base text-white/90 duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]"
                >
                  <HugeiconsIcon icon={item.icon} className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={`flex flex-col gap-1 mt-2 text-sm items-center`}>
              {NAV_ITEMS.map((item) => {
                const active = item.isActive(pathname);
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      router.push(item.route);
                      setLeftMobileMenu?.(false);
                    }}
                    className={`${active ? "bg-theme-hover text-white" : "bg-theme-surface text-gray-200"} ease-in-out hover:bg-theme-hover hover:text-white duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]`}
                  >
                    <HugeiconsIcon icon={item.icon} className={`w-4 h-4`} />
                    <span>{item.label}</span>
                    {item.key === "friends" && incomingRequestCount > 0 && (
                      <span className="ml-auto flex-none min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] leading-[18px] text-center">
                        {incomingRequestCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {!user?.user_id && showOrbitalSkeletons ? (
            <div className="flex mt-2 flex-col gap-2 items-center">
              <Skeleton className="h-[24px] mt-2 w-[240px] rounded-[4px]" />
            </div>
          ) : null}

          <div className="mt-auto w-full flex flex-col gap-2 p-1 bg-theme-surface/50">
            {!user?.username || !user?.user_id || !user?.avatar ? (
              <Skeleton className="h-16 w-full rounded-[12px]" />
            ) : (
              <>
                <PersistentCallWidget />
                <ProfileButton user={user} awayUsers={awayUsers} />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
