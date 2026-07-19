"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import { useCallStore } from "@/store/callStore";
import { TooltipWrapper } from "@/components/ui/tooltip";

import { useEffect, useState } from "react";

import { formatDuration } from "@/lib/utils/date";

export const CallOverlayHeader = () => {
  const { setCallOverlayOpen } = useUIStore();
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
    <div className="flex shrink-0 items-center px-4 h-12 w-full gap-4 border-b border-theme-border bg-theme-surface absolute top-0 left-0 z-10">
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
  );
};
