"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { MicOff02Icon, VideoOffIcon } from "@hugeicons/core-free-icons";

export const ParticipantCardMock = ({ className }: { className?: string }) => (
  <div
    className={`relative  bg-theme-base rounded-2xl overflow-hidden flex items-center justify-center border border-theme-border transition-all duration-500 ${className || "w-64 h-52"}`}
  >
    {/* Avatar - shown when video is off */}
    <div className="flex flex-col items-center justify-center">
      <div className="relative rounded-full w-24 h-24">
        <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-theme-border transition-colors duration-300">
          <Image
            src="/assets/ch.png"
            alt="Participant"
            fill
            sizes="(max-width: 768px) 96px, 96px"
            className="object-cover"
          />
        </div>
      </div>
    </div>

    {/* Name Label - bottom left */}
    <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white">
      <span>Ember</span>
      <div className="flex items-center">
        <div className="p-1.5 rounded-lg">
          <HugeiconsIcon
            icon={MicOff02Icon}
            className="w-3.5 h-3.5 text-gray-300"
          />
        </div>
        <div className="p-1.5 rounded-lg">
          <HugeiconsIcon
            icon={VideoOffIcon}
            className="w-3.5 h-3.5 text-gray-300"
          />
        </div>
      </div>
    </div>
  </div>
);
