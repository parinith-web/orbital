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
}

export function DetailsSidebar({ id, type, title }: DetailsSidebarProps) {
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
      {type === "room" && (
        <div className={sidebarTab === "info" ? "contents" : "hidden"}>
          <SidebarInfo
            id={id}
            type={type}
            room={room}
            members={members || []}
            currentUser={user}
            isLoading={isRoomLoading}
            onClose={handleClose}
          />
        </div>
      )}
      <div className={sidebarTab === "media" ? "contents" : "hidden"}>
        <SidebarMedia
          mediaFiles={mediaFiles || []}
          isLoading={isMediaLoading}
          onClose={handleClose}
        />
      </div>
      <div className={sidebarTab === "calls" ? "contents" : "hidden"}>
        <SidebarCalls
          roomId={id}
          conversationName={title}
          onClose={handleClose}
        />
      </div>
    </div>
  );
}
