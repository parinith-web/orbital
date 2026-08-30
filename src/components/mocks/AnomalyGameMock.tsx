"use client";

import AvatarStack from "@/components/ui/AvatarStack";
import { HugeiconsIcon } from "@hugeicons/react";
import { ViewOffSlashIcon, CrownIcon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";

export const AnomalyGameMock = ({ className }: { className?: string }) => (
  <div
    className={`flex flex-col w-full max-w-[400px] gap-3 ${className || ""}`}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-medium text-white">Anomaly</span>
        <span className="text-[10px] text-gray-400 bg-[#242424] rounded-full px-2 py-0.5">
          Round 3
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs text-gray-400">
        <HugeiconsIcon icon={CrownIcon} className="w-3.5 h-3.5" />
        <span>7 / 10</span>
      </div>
    </div>

    <div className="rounded-[14px] bg-[#101010] border border-[#242424] p-3">
      <div className="text-[11px] text-gray-500 mb-1.5">Your word</div>
      <div className="inline-block text-sm font-medium text-white bg-[#272727] rounded-lg px-3 py-1.5">
        NEBULA
      </div>
    </div>

    <div className="flex items-center justify-between rounded-[14px] bg-[#101010] border border-[#242424] p-3">
      <div className="flex items-center gap-2">
        <AvatarStack
          users={[
            { user_id: "pi", username: "pi", avatar: "/assets/pi.png" },
            { user_id: "ch", username: "ch", avatar: "/assets/ch.png" },
            { user_id: "bu", username: "bu", avatar: "/assets/bu.png" },
            { user_id: "sq", username: "sq", avatar: "/assets/sq.png" },
          ]}
          size={22}
          showCount
        />
        <span className="text-xs text-gray-400 flex items-center gap-1">
          <HugeiconsIcon icon={ViewOffSlashIcon} className="w-3.5 h-3.5" />
          Suspect Volt
        </span>
      </div>
      <Button
        variant="other"
        size="md"
        className="cursor-default pointer-events-none bg-[#272727] text-white text-xs px-3 py-1.5"
      >
        Vote
      </Button>
    </div>
  </div>
);
