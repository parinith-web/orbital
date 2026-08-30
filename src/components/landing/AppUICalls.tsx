"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ShieldKeyIcon } from "@hugeicons/core-free-icons";
import { ParticipantCard } from "@/components/features/calls/ParticipantCard";
import { CallControls } from "@/components/features/calls/CallControls";

/**
 * `ParticipantCard` is pure presentational (video/avatar tile, props in —
 * no store, no query). `CallControls` reads `useCallStore` directly, but
 * with no active call its mute/video buttons just flip local UI state and
 * its leave button no-ops on a missing `callId` — safe to mount live,
 * no wrapping needed.
 */
export function AppUICalls({ className }: { className?: string }) {
  return (
    <div className={`flex w-full flex-col items-center gap-4 ${className || ""}`}>
      <div className="flex items-center gap-1.5 rounded-full border border-[#242424] bg-[#101010] px-3 py-1 text-[11px] font-medium text-arcade-yellow">
        <HugeiconsIcon icon={ShieldKeyIcon} className="h-3.5 w-3.5" />
        End-to-end encrypted
      </div>

      <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-theme-border bg-theme-base">
        <div className="flex flex-wrap items-center justify-center gap-3 p-3">
          <div className="h-28 w-36 sm:h-36 sm:w-44">
            <ParticipantCard
              userId="demo-wave"
              profile={{ username: "Wave", avatar: "/assets/sq.png" }}
              isVideoOn={false}
              isMuted={false}
              isSpeaking
            />
          </div>
          <div className="h-28 w-36 sm:h-36 sm:w-44">
            <ParticipantCard
              userId="demo-volt"
              profile={{ username: "Volt", avatar: "/assets/pi.png" }}
              isVideoOn={false}
              isMuted
            />
          </div>
        </div>
        <CallControls />
      </div>
    </div>
  );
}

export default AppUICalls;
