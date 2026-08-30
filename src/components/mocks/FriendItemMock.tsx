"use client";

import Image from "next/image";
import { StatusIndicator } from "@/components/ui/StatusIndicator";

export const FriendItemMock = ({
  name = "Wave",
  avatar = "/assets/sq.png",
  status = "Active now",
  message,
  className,
}: {
  name?: string;
  avatar?: string;
  status?: string;
  message?: string;
  className?: string;
}) => (
  <div
    className={`flex items-center gap-3 px-3 py-2 bg-[#242424] rounded-[8px] border border-[#242424] shadow-2xl backdrop-blur-md text-gray-400 ${className || "w-56 h-[70px]"}`}
  >
    <div className="relative flex-shrink-0">
      <Image
        src={avatar}
        alt=""
        width={40}
        height={40}
        className="w-10 h-10 rounded-[12px]"
      />
      <StatusIndicator isOnline={true} isAway={false} />
    </div>
    <div className="flex-1 min-w-0 text-left">
      <div className="flex flex-col min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium truncate">
            {name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#aaaaaa] text-xs truncate">
            {message || status}
          </span>
        </div>
      </div>
    </div>
  </div>
);
