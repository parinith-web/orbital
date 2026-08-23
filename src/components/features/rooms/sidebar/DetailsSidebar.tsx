"use client";

import { useUIStore } from "@/store/uiStore";
import { useRoom, useRoomMembers, useMediaFiles } from "@/hooks";
import { useUserStore } from "@/store/useUserStore";
import { SidebarInfo } from "./sidebar-info/SidebarInfo";
import { SidebarMedia } from "./sidebar-media/SidebarMedia";
import { SidebarCalls } from "./sidebar-calls/SidebarCalls";

interface DetailsSidebarProps {
  id: string;
  type: "room" | "direct";
  title?: string;
  /** Which edge of the screen the sidebar is docked to. Defaults to "right". */
  side?: "left" | "right";
}

export function DetailsSidebar({ id, type, title, side }: DetailsSidebarProps) {
  const { sidebarTab, setSidebarOpen } = useUIStore();
  const handleClose = () => setSidebarOpen(false);
  const { room, isLoading: isRoomLoading } = useRoom(id);
  const members = useRoomMembers(id);
  const { mediaFiles, isLoading: isMediaLoading } = useMediaFiles({
    conversationId: id,
  });
  const user = useUserStore((s) => s.user);

  return (
    <div className="h-full flex flex-col">
      {type === "room" && sidebarTab === "info" && (
        <SidebarInfo
          id={id}
          type={type}
          room={room}
          members={members || []}
          currentUser={user}
          isLoading={isRoomLoading}
          onClose={handleClose}
          side={side}
        />
      )}
      {sidebarTab === "media" && (
        <SidebarMedia
          mediaFiles={mediaFiles || []}
          isLoading={isMediaLoading}
          onClose={handleClose}
          side={side}
        />
      )}
      {sidebarTab === "calls" && (
        <SidebarCalls
          roomId={id}
          conversationName={title}
          onClose={handleClose}
          side={side}
        />
      )}
    </div>
  );
}
