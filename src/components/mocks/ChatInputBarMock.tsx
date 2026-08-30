"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Attachment01Icon,
  ArrowRight01Icon,
  SmileIcon,
} from "@hugeicons/core-free-icons";

export const ChatInputBarMock = ({
  className,
  accent = true,
}: {
  className?: string;
  accent?: boolean;
}) => (
  <div
    className={`${className} flex flex-col z-[99] w-full md:max-w-[400px] relative px-2 md:px-3 py-1 md:py-3 rounded-xl transition-all duration-300 ease-in-out border ${accent
      ? "bg-theme-surface border-theme-border"
      : "bg-[#0a080b] border-white/10"
      }`}
  >
    <div className="flex flex-col gap-2">
      <div className="text-start text-gray-400 w-full rounded-[8px] text-sm bg-transparent py-[10px] md:py-2 px-3 placeholder-[#58565f] resize-none cursor-text">
        Press / to focus
      </div>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <div
            className={`border py-2 px-2 rounded-[12px] text-white cursor-default ${accent
              ? "border-theme-border hover:bg-theme-border"
              : "border-white/10 hover:bg-white/5"
              }`}
          >
            <HugeiconsIcon
              icon={Attachment01Icon}
              className="text-gray-400 w-4 h-4"
            />
          </div>
          <div
            className={`border py-2 px-2 rounded-[12px] text-white cursor-default ${accent
              ? "border-theme-border hover:bg-theme-border"
              : "border-white/10 hover:bg-white/5"
              }`}
          >
            <HugeiconsIcon icon={SmileIcon} className="text-gray-400 w-4 h-4" />
          </div>
        </div>
        <div
          className={`py-3 px-3 rounded-[12px] cursor-default ${accent ? "bg-theme-accent text-theme-text" : "bg-white text-black"
            }`}
        >
          <HugeiconsIcon icon={ArrowRight01Icon} className="w-3 h-3" />
        </div>
      </div>
    </div>
  </div>
);

