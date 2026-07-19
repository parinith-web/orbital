import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";
import { TooltipWrapper } from "@/components/ui/tooltip";


interface FloatingButtonsProps {
  showNewMessageBadge: boolean;
  showScrollDownButton: boolean;
  newArrivalCount: number;
  onBadgeClick: () => void;
  onScrollDownClick: () => void;
  color?: string; // kept for compatibility, not used directly
}

export function FloatingButtons({
  showNewMessageBadge,
  showScrollDownButton,
  newArrivalCount,
  onBadgeClick,
  onScrollDownClick,
}: FloatingButtonsProps) {
  return (
    <>
      {showNewMessageBadge && (
        <button
          onClick={onBadgeClick}
          className="absolute bottom-5 z-[2000] left-[50%] translate-x-[-50%] rounded-[10px] px-3 py-1.5 text-sm cursor-pointer border border-theme-border bg-theme-base/95 backdrop-blur-sm text-gray-300 transition-all duration-200 ease-out hover:bg-theme-hover active:scale-95 flex items-center gap-1.5 shadow-lg"
        >
          <HugeiconsIcon icon={ArrowDown01Icon} className={cn("h-4 w-4")} />
          <span>
            {newArrivalCount}
            {newArrivalCount >= 50 ? "+" : ""} new message{newArrivalCount !== 1 ? "s" : ""}
          </span>
        </button>
      )}



      {showScrollDownButton && (
        <TooltipWrapper content="Scroll to bottom">
          <button
            onClick={onScrollDownClick}
            className="absolute bottom-5 z-[2000] left-[50%] translate-x-[-50%] rounded-[10px] p-1 text-gray-400 cursor-pointer border border-theme-border bg-theme-base transition-all duration-200 ease-out hover:bg-theme-hover active:scale-95"
          >
            <HugeiconsIcon icon={ArrowDown01Icon} className={cn("h-6 w-6")} />
          </button>
        </TooltipWrapper>
      )}

    </>
  );
}
