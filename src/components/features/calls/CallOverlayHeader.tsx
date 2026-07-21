"use client";

import { useCallStore } from "@/store/callStore";

import { useEffect, useState } from "react";

import { formatDuration } from "@/lib/utils/date";

/**
 * H7.2 — the old "Back to Chat" arrow (`setCallOverlayOpen(false)`) is
 * gone: that only made sense when this header sat atop a full-screen
 * modal takeover with chat hidden behind it. Docked in `GameRoomSidePanel`
 * beside chat that's always visible below it, there's nothing to "go
 * back" to — this is just the call's elapsed-time readout now. See
 * `CallOverlay.tsx`'s header comment for the rest of the H7.2 rationale.
 */
export const CallOverlayHeader = () => {
  const { startedAt } = useCallStore();
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

  return (
    <div className="flex shrink-0 items-center justify-center px-4 h-12 w-full gap-4 border-b border-theme-border bg-theme-surface absolute top-0 left-0 z-10">
      <div className="flex items-center gap-2 text-gray-200 text-sm">
        <span>{elapsed}</span>
      </div>
    </div>
  );
};
