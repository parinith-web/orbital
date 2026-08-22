"use client";

import { useUIStore } from "@/store/uiStore";
import { useCallStore } from "@/store/callStore";
import { RoomParticipantGrid } from "./RoomParticipantGrid";
import { RoomCallControls } from "./RoomCallControls";
import { RoomCallOverlayHeader } from "./RoomCallOverlayHeader";
import { usePathname } from "next/navigation";

/**
 * Session 3 — ported from Portal's `CallOverlay.tsx`, adapted to
 * Orbital's `/orbital/room/[room_id]` route (Orbital has no DM/friend
 * call route yet, so Portal's `direct_...`/`/portal/friend/` branch is
 * intentionally omitted rather than ported dead).
 *
 * This is the full-screen call takeover for plain chat/call rooms (built
 * from `RoomParticipantGrid`/`RoomCallControls`/`RoomCallOverlayHeader`,
 * §3.2 of the plan), mounted only by `PlainRoomLayout`. Anomaly's game
 * rooms keep using the existing docked `CallPanel`/`CallOverlay` — this
 * component is never imported by anything under `features/anomaly/` or by
 * `CallPanel.tsx`.
 */
export const RoomCallOverlay = () => {
  const pathname = usePathname();
  const { isCallOverlayOpen } = useUIStore();
  const { actualRoomId, status } = useCallStore();
  const isActive = status === "joined" || status === "joining";

  const isOnCorrectPage =
    !!actualRoomId && pathname.includes(`/orbital/room/${actualRoomId}`);

  if (!isCallOverlayOpen || !isActive || !isOnCorrectPage) {
    return null;
  }

  return (
    <div className="fixed md:absolute inset-0 z-[9999] bg-theme-base flex flex-col min-w-0 overflow-hidden">
      <RoomCallOverlayHeader />
      <div className="w-full h-full flex-1 md:pt-12 md:pb-20 pb-2 min-w-0 relative">
        <RoomParticipantGrid />
      </div>
      <RoomCallControls />
    </div>
  );
};
