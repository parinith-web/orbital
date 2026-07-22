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
 *
 * Session 4 (CallPanel port) — dropped the `absolute top-0 z-10` overlay
 * positioning. That was needed when `CallOverlay` was a fixed `h-72` box
 * with the participant grid filling the whole area behind it (hence
 * `ParticipantGrid`'s old `pt-16` hack to avoid this header covering the
 * top row). Now that `CallOverlay` is a real flex column (see that file's
 * header comment), this is just a normal shrink-0 row above the grid.
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
    <div className="flex shrink-0 items-center justify-center px-4 h-10 w-full gap-4 border-b border-theme-border bg-theme-surface">
      <div className="flex items-center gap-2 text-gray-400 text-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
        <span>{elapsed}</span>
      </div>
    </div>
  );
};
