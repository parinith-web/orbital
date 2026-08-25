"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import { useCallStore } from "@/store/callStore";
import { useUserStore } from "@/store/useUserStore";
import { useRooms } from "@/contexts/roomContext";
import { useRoomMembers } from "@/hooks";
import { TooltipWrapper } from "@/components/ui/tooltip";

import { useEffect, useState } from "react";

import { formatDuration } from "@/lib/utils/date";

/**
 * Session 3 — ported verbatim from Portal's `CallOverlayHeader.tsx`.
 * Room-scoped fork; see `RoomParticipantGrid.tsx` for why this isn't a
 * shared component.
 *
 * The host previously had no way to delete the room while this overlay
 * was open — it's a `fixed inset-0 z-[9999]` takeover (see
 * `RoomCallOverlay.tsx`) that sits above the `RightSidebar`/`CallPanel`
 * dropdowns that normally carry "Delete Room". Surfacing it here too
 * means the host doesn't have to leave the call just to delete the room.
 */
export const RoomCallOverlayHeader = () => {
  const { setCallOverlayOpen, setModal } = useUIStore();
  const { startedAt, actualRoomId } = useCallStore();
  const user = useUserStore((s) => s.user);
  const { rooms } = useRooms();
  const members = useRoomMembers(actualRoomId ?? null);
  const [elapsed, setElapsed] = useState(
    startedAt ? formatDuration(startedAt) : "00:00",
  );

  useEffect(() => {
    if (!startedAt) return;

    const interval = setInterval(() => {
      setElapsed(formatDuration(startedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [startedAt]);

  const room = rooms.find((r) => r.room_id === actualRoomId);
  const roomName = room?.Rooms?.room_name ?? "";
  const owner = members?.find((m) => m.role === "owner");
  const owner_id = owner?.user_id ?? "";
  const isOwner = !!actualRoomId && owner_id === (user?.user_id ?? "");

  return (
    <div className="flex shrink-0 items-center justify-between px-4 h-12 w-full gap-4 border-b border-theme-border bg-theme-surface absolute top-0 left-0 z-10">
      <div className="flex items-center gap-4">
        <TooltipWrapper content="Back to Chat">
          <button
            onClick={() => setCallOverlayOpen(false)}
            className="w-8 h-8 flex items-center justify-center hover:bg-theme-hover cursor-pointer duration-100 transition-all ease-in-out rounded-lg text-gray-200"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5" />
          </button>
        </TooltipWrapper>

        <div className="flex items-center gap-2 text-gray-200 text-sm">
          <span>{elapsed}</span>
        </div>
      </div>

      {isOwner && (
        <TooltipWrapper content="Delete Room">
          <button
            onClick={() =>
              setModal("LEAVE_ROOM", {
                roomName,
                owner_id,
                room_id: actualRoomId,
              })
            }
            className="w-8 h-8 flex items-center justify-center hover:bg-theme-hover cursor-pointer duration-100 transition-all ease-in-out rounded-lg text-red-300"
          >
            <HugeiconsIcon icon={Delete02Icon} className="w-4 h-4" />
          </button>
        </TooltipWrapper>
      )}
    </div>
  );
};
