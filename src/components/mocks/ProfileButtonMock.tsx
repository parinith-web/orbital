"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Logout01Icon } from "@hugeicons/core-free-icons";
import { StatusIndicator } from "@/components/ui/StatusIndicator";

export const ProfileButtonMock = ({
  name = "Ember",
  avatar = "/assets/ch.png",
  className,
}: {
  name?: string;
  avatar?: string;
  className?: string;
}) => (
  <div
    className={`flex justify-between items-center cursor-default bg-[#272727] ease-in-out rounded-xl w-56 px-2 py-2 ${className}`}
  >
    <div className="flex gap-4 items-center">
      <div className="relative">
        <Image
          src={avatar}
          alt="Avatar"
          width={40}
          height={40}
          className="rounded-[12px] w-10 h-10 object-cover"
        />
        <StatusIndicator isOnline={true} isAway={false} />
      </div>
      <div className="flex flex-col text-sm text-left">
        <span className="truncate max-w-[120px] text-white">{name}</span>
        <span className="text-[#aaaaaa] font-extralight cursor-default text-xs">
          u8PoR_t4ALz1...
        </span>
      </div>
    </div>
    <HugeiconsIcon
      icon={Logout01Icon}
      className="w-4 h-4 mr-1 text-white hover:text-gray-200 cursor-default"
    />
  </div>
);
