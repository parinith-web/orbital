import React, { memo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { CallIcon } from "@hugeicons/core-free-icons";
import type { UserRoom } from "@/lib/types/room";
import { useColor } from "@/contexts/colorContext";
import { RoomAvatar } from "@/components/ui/RoomAvatar";

interface RoomItemProps {
  room: UserRoom;
  router: { push: (href: string) => void };
  setMobileMenu?: (value: boolean) => void;
  currentRoom?: string | number | null;
  hasActiveCall?: boolean;
  unreadCount?: number;
  hasUnreadMentions?: boolean;
}

export const RoomItem = memo(function RoomItem({
  room,
  router,
  setMobileMenu,
  currentRoom,
  hasActiveCall = false,
  unreadCount = 0,
  hasUnreadMentions = false,
}: RoomItemProps) {
  const roomId = room?.Rooms?.room_id ?? room?.room_id ?? "";
  const roomName = room?.Rooms?.room_name ?? "";

  const { textColor } = useColor();
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        setMobileMenu?.(false);
        router.push(`/portal/room/${roomId}`);
      }}
      className={`cursor-pointer relative flex items-center gap-3 mt-2 ml-1 rounded-[8px] py-2 px-2 hover:bg-theme-hover ${
        currentRoom?.toString() === roomId && "bg-theme-hover"
      }`}
    >
      <div className="relative flex-shrink-0">
        <RoomAvatar name={roomName} className="w-10 h-10" />
        {hasActiveCall && (
          <HugeiconsIcon
            icon={CallIcon}
            className="rounded-full text-green-500 bg-theme-hover border border-theme-border p-0.5 absolute -right-1 bottom-0 h-4 w-4"
          />
        )}
      </div>

      <div className="flex items-center flex-1 min-w-0">
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <span className={`truncate max-w-[100px] text-white`}>
              {roomName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[#aaaaaa] text-xs truncate max-w-[150px]">
              ID: {roomId}
            </span>
          </div>
        </div>
        {unreadCount > 0 && (
          <span
            style={{ color: hasUnreadMentions ? "#ffffff" : textColor }}
            className={`mr-2 inline-flex font-medium h-4 w-4 items-center justify-center rounded-full p-2 text-[8px] ${
              hasUnreadMentions ? "bg-red-500" : "bg-theme-accent"
            }`}
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </div>
    </div>
  );
});
