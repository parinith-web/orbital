"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  Image02Icon,
  CallIcon,
  MoreVerticalIcon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { UserProfilePopup } from "@/components/popups/UserProfilePopup";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { UserRemove01Icon } from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/useUserStore";
import type { ConvexFriend } from "@/hooks/useFriends";
import { useFriendActions } from "@/hooks/useFriends";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const NOTIFICATION_OPTIONS = [
  { value: "all", label: "All messages" },
  { value: "mentions", label: "Mentions only" },
  { value: "nothing", label: "Nothing" },
];

interface FriendChatHeaderProps {
  friend: ConvexFriend | undefined;
  directConversationId: string;
  onlineUsers: Set<string>;
  awayUsers: Set<string>;
  activeCalls: unknown[];
  isInCall: boolean;
  actualRoomId: string | null;
}

export function FriendChatHeader({
  friend,
  directConversationId,
  onlineUsers,
  awayUsers,
  activeCalls,
  isInCall,
  actualRoomId,
}: FriendChatHeaderProps) {
  const router = useRouter();
  const user = useUserStore((s) => s.user);
  const {
    isSidebarOpen,
    sidebarTab,
    toggleSidebar,
    leftMobileMenu,
    setLeftMobileMenu,
    setModal,
  } = useUIStore();
  const { setNotificationPreference } = useFriendActions();

  const [notificationPref, setNotificationPref] = useState<string>("all");

  useEffect(() => {
    if (friend?.friend?.user_id) {
      setNotificationPref(friend.notificationPreference || "all");
    }
  }, [friend?.friend?.user_id, friend?.notificationPreference]);

  const handleNotificationChange = async (preference: string) => {
    if (!friend?.friend?.user_id) return;
    try {
      await setNotificationPreference({
        friend_id: friend.friend.user_id,
        preference,
      });
      setNotificationPref(preference);
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Failed to update preference",
      );
    }
  };

  const isUserOnline = friend?.friend?.user_id
    ? onlineUsers.has(friend.friend.user_id)
    : false;
  const isUserAway = friend?.friend?.user_id
    ? awayUsers.has(friend.friend.user_id)
    : false;

  return (
    <>
      <div className="flex shrink-0 items-center p-2 h-12 w-full gap-4 border-b border-theme-border bg-theme-hover bg-opacity-100">
        <TooltipWrapper content="Back">
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            onClick={() => router.push("/portal")}
            className="w-7 h-7 hover:bg-theme-base cursor-pointer duration-100 transition-all ease-in-out rounded-[8px] p-1 text-white/70"
          />
        </TooltipWrapper>
        <div className="relative flex flex-1 items-center gap-3 group w-fit">
          <UserProfilePopup
            user={{
              id: friend?.friend?.user_id || "",
              username: friend?.friend?.username || "",
              avatarUrl: friend?.friend?.avatar,
              joinedAt: friend?._creationTime
                ? new Date(friend._creationTime).toISOString()
                : new Date().toISOString(),
            }}
            currentUserId={user?.user_id}
            side="bottom"
            align="start"
          >
            <div className="flex items-center cursor-pointer gap-3">
              <div className="relative">
                <Image
                  src={friend?.friend?.avatar || "@/assets/defaultAvatar.png"}
                  alt="pic"
                  width={28}
                  height={28}
                  unoptimized
                  className="w-7 h-7 rounded-[8px]"
                />
                <StatusIndicator isOnline={isUserOnline} isAway={isUserAway} />
              </div>
              <span className="text-white/80 text-sm group-hover:text-white transition-colors">
                {friend?.friend?.username}
              </span>
            </div>
          </UserProfilePopup>
        </div>
        <div className="flex items-center gap-2">
          <TooltipWrapper content="Media Gallery">
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar("media");
              }}
              className={cn(
                "w-7 select-none h-7 cursor-pointer duration-100 ease-in-out rounded-[8px] p-1 flex items-center justify-center transition-colors",
                isSidebarOpen && sidebarTab === "media"
                  ? "bg-theme-base"
                  : "hover:bg-theme-base",
              )}
            >
              <HugeiconsIcon
                icon={Image02Icon}
                className={cn(
                  "w-4 h-4 transition-colors",
                  isSidebarOpen && sidebarTab === "media"
                    ? "text-white"
                    : "text-white/70",
                )}
              />
            </div>
          </TooltipWrapper>

          <TooltipWrapper content="Calls">
            <div
              onClick={() => toggleSidebar("calls")}
              className={cn(
                "w-7 select-none h-7 cursor-pointer duration-100 ease-in-out rounded-[8px] p-1 flex items-center justify-center transition-colors relative",
                isSidebarOpen && sidebarTab === "calls"
                  ? "bg-theme-base"
                  : "hover:bg-theme-base",
              )}
            >
              <HugeiconsIcon
                icon={CallIcon}
                className={cn(
                  "w-4 h-4 transition-colors",
                  isSidebarOpen && sidebarTab === "calls"
                    ? "text-white"
                    : "text-white/70",
                )}
              />
              {activeCalls.length > 0 && (
                <span
                  className={cn(
                    "absolute top-1 right-1 w-2 h-2 rounded-full",
                    isInCall && actualRoomId === directConversationId
                      ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"
                      : "bg-green-500",
                  )}
                />
              )}
            </div>
          </TooltipWrapper>

          <DropdownMenu.Root modal={false}>
            <DropdownMenu.Trigger asChild>
              <button className="flex items-center">
                <HugeiconsIcon
                  icon={MoreVerticalIcon}
                  className="w-7 h-7 hover:bg-theme-base cursor-pointer duration-100 transition-all ease-in-out rounded-[8px] p-1 text-white/70"
                />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                sideOffset={8}
                align="end"
                className="w-44 bg-theme-base border border-theme-border rounded-lg shadow-xl z-[1000] animate-in fade-in duration-100 outline-none"
              >
                <DropdownMenu.Sub>
                  <DropdownMenu.SubTrigger className="flex items-center rounded-t-lg justify-between w-full px-3 py-2 text-sm text-gray-200 hover:bg-theme-hover cursor-pointer outline-none">
                    <span>Notifications</span>
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      className="w-3 h-3 text-gray-300"
                    />
                  </DropdownMenu.SubTrigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.SubContent
                      sideOffset={6}
                      className="w-40 bg-theme-base border border-theme-border rounded-lg shadow-xl z-[9999] animate-in fade-in duration-100 outline-none"
                    >
                      {NOTIFICATION_OPTIONS.map((option) => (
                        <DropdownMenu.Item
                          key={option.value}
                          onClick={() => handleNotificationChange(option.value)}
                          className={`flex items-center justify-between px-3 py-2 text-sm text-gray-200 ${notificationPref === option.value ? "bg-theme-hover" : ""} hover:bg-theme-hover cursor-pointer outline-none`}
                        >
                          <span>{option.label}</span>
                        </DropdownMenu.Item>
                      ))}
                    </DropdownMenu.SubContent>
                  </DropdownMenu.Portal>
                </DropdownMenu.Sub>
                <DropdownMenu.Separator className="h-px bg-theme-border" />
                <DropdownMenu.Item
                  onClick={() => {
                    setModal("REMOVE_FRIEND", { friend });
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm rounded-b-lg text-red-300 hover:bg-theme-hover cursor-pointer outline-none"
                >
                  <HugeiconsIcon icon={UserRemove01Icon} className="w-4 h-4" />
                  Remove Friend
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </>
  );
}
