"use client";

import { useUIStore } from "@/store/uiStore";
import { useCallStore } from "@/store/callStore";
import { ParticipantGrid } from "./ParticipantGrid";
import { CallControls } from "./CallControls";
import { CallOverlayHeader } from "./CallOverlayHeader";
import { SignalPanel } from "@/components/features/signal/SignalPanel";
import { usePathname } from "next/navigation";

export const CallOverlay = () => {
  const pathname = usePathname();
  const { isCallOverlayOpen } = useUIStore();
  const { actualRoomId, status } = useCallStore();
  const isActive = status === "joined" || status === "joining";

  const isOnCorrectPage = (() => {
    if (!actualRoomId) return false;

    return pathname.includes(`/portal/room/${actualRoomId}`);
  })();

  if (!isCallOverlayOpen || !isActive || !isOnCorrectPage) {
    return null;
  }

  return (
    <div className="fixed md:absolute inset-0 z-[9999] bg-theme-base flex flex-col min-w-0 overflow-hidden">
      <CallOverlayHeader />
      <div className="w-full h-full flex-1 md:pt-12 md:pb-20 pb-2 min-w-0 relative">
        <ParticipantGrid />
        <SignalPanel />
      </div>
      <CallControls />
    </div>
  );
};
