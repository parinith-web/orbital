"use client";
import { useEffect, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserAdd01Icon,
  Add01Icon,
  Home01Icon,
  UserGroupIcon,
  GameController01Icon,
} from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { useRooms } from "@/contexts/roomContext";
import { useUserStore } from "@/store/useUserStore";
import { RoomsList } from "@/components/features/rooms/RoomsList";
import { usePresence } from "@/contexts/presenceContext";
import { ProfileButton } from "@/components/features/profile/ProfileButton";
import { useUIStore } from "@/store/uiStore";
import { useUnreadCounters } from "@/hooks";
import PersistentCallWidget from "@/components/features/calls/PersistentCallWidget";
import { useActiveConversationId } from "@/hooks/useActiveConversationId";
import { useColor } from "@/contexts/colorContext";

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
  const currentRoom = useActiveConversationId();
  const { rooms } = useRooms();
  const user = useUserStore((s) => s.user);
  const { awayUsers } = usePresence();
  const { setModal, leftMobileMenu, setLeftMobileMenu } = useUIStore();
  const { counters } = useUnreadCounters();

  const { color, textColor } = useColor();
  const { unreadByRoomId, roomHasUnreadMentions } = useMemo(() => {
    const counts = new Map<string, number>();
    const hasMentions = new Map<string, boolean>();
    for (const counter of counters) {
      if (counter.sourceType !== "room" || counter.unreadCount <= 0) {
        continue;
      }
      counts.set(counter.conversationId, counter.unreadCount);
      if (counter.hasUnreadMentions) {
        hasMentions.set(counter.conversationId, true);
      }
    }
    return { unreadByRoomId: counts, roomHasUnreadMentions: hasMentions };
  }, [counters]);

  const directUnreadCount = useMemo(
    () =>
      counters.reduce((total, counter) => {
        if (counter.sourceType === "direct" && counter.unreadCount > 0) {
          return total + counter.unreadCount;
        }
        return total;
      }, 0),
    [counters],
  );

  const isOnFriendsPage = /^\/portal$/.test(pathname);
  const isOnSignalPage = /^\/portal\/signal$/.test(pathname);

  //open join dialog when path name have search params: join
  useEffect(() => {
    if (joinParam) {
      setModal("JOIN_ROOM");
      router.replace(pathname);
    }
  }, [joinParam, pathname, router, setModal]);

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
          {!user?.user_id || !rooms ? (
            <div className="flex flex-col gap-1 mt-2 text-sm items-center">
              <div className="ease-in-out bg-theme-base text-white/90 duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]">
                <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" />
                <span>Friends</span>
              </div>
              <div className="ease-in-out bg-theme-base text-white/90 duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]">
                <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
                <span>Create Room</span>
              </div>
              <div className="ease-in-out bg-theme-base text-white/90 duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]">
                <HugeiconsIcon icon={UserAdd01Icon} className="w-4 h-4" />
                <span>Join Room</span>
              </div>
              <div className="ease-in-out bg-theme-base text-white/90 duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]">
                <HugeiconsIcon icon={GameController01Icon} className="w-4 h-4" />
                <span>Join a Game</span>
              </div>
            </div>
          ) : (
            <div className={`flex flex-col gap-1 mt-2 text-sm items-center`}>
              <button
                onClick={() => {
                  router.push("/portal");
                  setLeftMobileMenu?.(false);
                }}
                className={`${isOnFriendsPage ? "bg-theme-hover text-white" : "bg-theme-surface text-gray-200"} ease-in-out  hover:bg-theme-hover hover:text-white duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]`}
              >
                <HugeiconsIcon icon={UserGroupIcon} className={`w-4 h-4`} />
                <span>Friends</span>
                {directUnreadCount > 0 && (
                  <span style={{ color: textColor }} className="ml-auto inline-flex h-4 w-4 items-center justify-center rounded-full bg-theme-accent px-2 text-[8px]">
                    {directUnreadCount > 99 ? "99+" : directUnreadCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setModal("CREATE_ROOM")}
                className="ease-in-out bg-theme-surface hover:bg-theme-hover text-gray-200 hover:text-white duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]"
              >
                <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
                <span>Create Room</span>
              </button>

              <button
                onClick={() => setModal("JOIN_ROOM")}
                className="ease-in-out bg-theme-surface hover:bg-theme-hover text-gray-200 hover:text-white duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]"
              >
                <HugeiconsIcon icon={UserAdd01Icon} className="w-4 h-4" />
                <span>Join Room</span>
              </button>

              <button
                onClick={() => {
                  router.push("/portal/signal");
                  setLeftMobileMenu?.(false);
                }}
                className={`${isOnSignalPage ? "bg-theme-hover text-white" : "bg-theme-surface text-gray-200"} ease-in-out hover:bg-theme-hover hover:text-white duration-200 flex items-center px-3 gap-2 w-56 py-2 rounded-[8px]`}
              >
                <HugeiconsIcon icon={GameController01Icon} className="w-4 h-4" />
                <span>Join a Game</span>
              </button>
            </div>
          )}
          {!user?.user_id || !rooms ? (
            showPortalSkeletons ? (
              <div className="flex mt-2 flex-col gap-2 items-center">
                <Skeleton className="h-[24px] mt-2 w-[240px] rounded-[4px]" />
                <div className="flex mt-2 flex-col items-center gap-2">
                  <div className="flex gap-2 items-center">
                    <Skeleton className="rounded-[8px] w-9 h-9" />
                    <div className="flex flex-col ">
                      <Skeleton className="h-[26px] mt-2 w-[190px] rounded-[4px]" />
                      <Skeleton className="h-[12px] mt-2 w-[120px] rounded-[4px]" />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Skeleton className="rounded-[8px] w-9 h-9" />
                    <div className="flex flex-col ">
                      <Skeleton className="h-[26px] mt-2 w-[190px] rounded-[4px]" />
                      <Skeleton className="h-[12px] mt-2 w-[120px] rounded-[4px]" />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Skeleton className="rounded-[8px] w-9 h-9" />
                    <div className="flex flex-col ">
                      <Skeleton className="h-[26px] mt-2 w-[190px] rounded-[4px]" />
                      <Skeleton className="h-[12px] mt-2 w-[120px] rounded-[4px]" />
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <Skeleton className="rounded-[8px] w-9 h-9" />
                    <div className="flex flex-col ">
                      <Skeleton className="h-[26px] mt-2 w-[190px] rounded-[4px]" />
                      <Skeleton className="h-[12px] mt-2 w-[120px] rounded-[4px]" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          ) : (
            <div className="mt-3 flex-1 flex flex-col min-h-0 w-full overflow-hidden">
              <div className="flex justify-between items-center px-3 text-[#aaaaaa] mb-2">
                <span className="text-xs">Rooms</span>
                <div className="bg-theme-hover rounded-[8px] px-2 py-1 flex text-white/60 text-[10px] items-center gap-1">
                  <HugeiconsIcon icon={Home01Icon} className="w-3 h-3" />
                  {rooms.length ?? 0}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                <RoomsList
                  currentRoom={currentRoom}
                  unreadByRoomId={unreadByRoomId}
                  roomHasUnreadMentions={roomHasUnreadMentions}
                />
              </div>
            </div>
          )}

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
