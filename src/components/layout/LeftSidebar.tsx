"use client";
import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Home01Icon,
  GameController01Icon,
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

/**
 * H4 — the chat-app nav (Friends / Create Room / Join Room / standalone
 * Rooms list) has been stripped out here: there's no Friends tab, no DMs,
 * and no generic Rooms list to reach outside a game anymore. What's left
 * is a light nav appropriate for a game-first app — just a way back to the
 * game hub, a way into the public "Play Online" lobby, and the
 * profile/call chrome. The Game Hub itself (Create Room / Join Room /
 * Play Online tiles) landed in H6.2 (`app/portal/(main)/page.tsx`).
 *
 * H6.3 — the `?join=` deep-link is now wired to H6.1's Join Room modal
 * instead of being dropped: a shared link like `/portal?join=7K4RXP` opens
 * `JoinRoomModal` with the code pre-filled via `setModal("JOIN_ROOM",
 * { join_code })`, which `GlobalModals.tsx` already reads from
 * `modalData?.join_code`. The param is then stripped from the URL so a
 * refresh/back-nav doesn't reopen the modal.
 */

type LeftSidebarProps = {
  className?: string;
  showPortalSkeletons?: boolean;
};

export default function LeftSidebar({
  className = "",
  showPortalSkeletons = true,
}: LeftSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinParam = searchParams.get("join");
  const user = useUserStore((s) => s.user);
  const { awayUsers } = usePresence();
  const { leftMobileMenu, setLeftMobileMenu, setModal } = useUIStore();

  const isOnHubPage = /^\/portal$/.test(pathname);
  const isOnSignalPage = /^\/portal\/signal$/.test(pathname);

  // H6.3 — a shared `/portal?join=CODE` link opens Join Room with the code
  // pre-filled, then drops the param from the URL so the modal doesn't
  // reopen on refresh/back-nav. Only fires once user auth has resolved
  // (mirrors the rest of this component gating on `user?.user_id`) so an
  // unauthenticated visitor lands on the normal auth flow first rather than
  // popping a modal behind Clerk's redirect.
  useEffect(() => {
    if (joinParam && user?.user_id) {
      setModal("JOIN_ROOM", { join_code: joinParam.toUpperCase() });
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
              <div className="ease-in-out bg-theme-base text-white/90 duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]">
                <HugeiconsIcon icon={Home01Icon} className="w-4 h-4" />
                <span>Game Hub</span>
              </div>
              <div className="ease-in-out bg-theme-base text-white/90 duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]">
                <HugeiconsIcon icon={GameController01Icon} className="w-4 h-4" />
                <span>Play Online</span>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col gap-1 mt-2 text-sm items-center`}>
              <button
                onClick={() => {
                  router.push("/portal");
                  setLeftMobileMenu?.(false);
                }}
                className={`${isOnHubPage ? "bg-theme-hover text-white" : "bg-theme-surface text-gray-200"} ease-in-out hover:bg-theme-hover hover:text-white duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]`}
              >
                <HugeiconsIcon icon={Home01Icon} className={`w-4 h-4`} />
                <span>Game Hub</span>
              </button>

              <button
                onClick={() => {
                  router.push("/portal/signal");
                  setLeftMobileMenu?.(false);
                }}
                className={`${isOnSignalPage ? "bg-theme-hover text-white" : "bg-theme-surface text-gray-200"} ease-in-out hover:bg-theme-hover hover:text-white duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]`}
              >
                <HugeiconsIcon icon={GameController01Icon} className="w-4 h-4" />
                <span>Play Online</span>
              </button>
            </div>
          )}

          {!user?.user_id && showPortalSkeletons ? (
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
