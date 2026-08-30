"use client";

import Image from "next/image";
import { HashtagIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const MessageNotificationMock = ({
  name = "Sam",
  avatar = "/assets/ch.png",
  message = "Hey, did you check the latest update?",
  room = "orbital",
  stacked = false,
  className,
}: {
  name?: string;
  avatar?: string;
  message?: string;
  room?: string;
  stacked?: boolean;
  className?: string;
}) => {
  const content = (
    <div className="group flex  items-start gap-3 min-h-[72px]">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-[#242424] bg-[#101010]">
        <Image
          src={avatar}
          alt=""
          width={40}
          height={40}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <div className="flex min-w-0 items-center gap-3">
          <p className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
            {name}
          </p>
          <div className="ml-auto pr-1 flex flex-shrink-0 items-center gap-1.5 text-xs text-white/55">
            <HugeiconsIcon
              icon={HashtagIcon}
              className="h-3.5 w-3.5 flex-shrink-0"
            />
            <span className="max-w-[130px] truncate text-sm text-white/75">
              {room}
            </span>
          </div>
        </div>
        <div className="mt-1 flex items-start gap-3">
          <p className="line-clamp-2 min-w-0 flex-1 text-sm text-white/60">
            {message}
          </p>
          <p className="ml-auto pr-1 flex-shrink-0 pt-0.5 text-xs text-white/35">
            2m
          </p>
        </div>
      </div>
    </div>
  );

  if (stacked) {
    return (
      <div className={`relative ${className || "w-72"}`}>
        <div className="absolute inset-0 bg-[#101010]/40 border border-[#242424] rounded-[14px] translate-y-5 scale-[0.91] opacity-50 z-0" />
        <div className="absolute inset-0 bg-[#101010]/70 border border-[#242424] rounded-[14px] translate-y-2 scale-[0.96] opacity-80 z-[1]" />

        {/* Main card */}
        <div
          className={`group relative rounded-[14px] p-3 bg-[#101010] border border-[#242424] shadow-2xl backdrop-blur-md w-full z-[2] min-h-[72px]`}
        >
          {content}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group rounded-[14px] p-3 bg-[#101010] border border-[#242424] shadow-2xl backdrop-blur-md min-h-[72px] ${className}`}
    >
      {content}
    </div>
  );
};
