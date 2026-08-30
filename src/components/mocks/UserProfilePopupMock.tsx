"use client";

import Image from "next/image";
import { Message01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const UserProfilePopupMock = ({
  name = "Wave",
  avatar = "/assets/sq.png",
  joinedDate = "Joined April 2024",
  className,
}: {
  name?: string;
  avatar?: string;
  joinedDate?: string;
  className?: string;
}) => (
  <div
    className={`rounded-xl border border-[#242424] bg-[#0a0a0a] shadow-2xl backdrop-blur-md ${className || "w-64"}`}
  >
    <div className="flex flex-col items-center p-4 gap-3">
      <div className="relative">
        <Image
          src={avatar}
          width={64}
          height={64}
          alt=""
          className="w-16 h-16 rounded-full object-cover ring-2 ring-[#242424]"
        />
      </div>
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-base font-semibold text-white truncate max-w-[200px]">
          {name}
        </h3>
        <span className="text-xs text-gray-400">{joinedDate}</span>
      </div>
      <div className="flex items-center gap-2 w-full mt-1">
        <div className="p-2 rounded-xl bg-[#242424] text-white">
          <HugeiconsIcon className="h-5 w-5" icon={Message01Icon} />
        </div>
        <div className="flex-1 py-2 px-4 rounded-xl bg-red-500/5 text-red-300 text-sm text-center">
          Remove Friend
        </div>
      </div>
    </div>
  </div>
);
