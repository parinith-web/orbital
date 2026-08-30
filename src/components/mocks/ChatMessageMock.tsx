"use client";

import Image from "next/image";

export const ChatMessageMock = ({
  name = "Sam",
  avatar = "/assets/ch.png",
  message = "Hey! Have you seen the new design?",
  secondMessage,
  className,
  showDate = true,
}: {
  name?: string;
  avatar?: string;
  message?: string;
  secondMessage?: string;
  className?: string;
  showDate?: boolean;
}) => (
  <div className={`w-full overflow-hidden pb-4 text-left ${className}`}>
    {showDate && (
      <div className="flex items-center justify-center py-4 px-4 md:px-10">
        <span className="px-4 py-1 rounded-full bg-theme-border text-xs text-gray-300">
          26 April 2026
        </span>
      </div>
    )}

    {/* Primary Message */}
    <div className="px-4 md:px-10 transition-colors hover:bg-theme-border duration-200">
      <div className="flex gap-2">
        <Image
          src={avatar}
          width={40}
          height={40}
          alt=""
          className="w-10 h-10 rounded-[12px] flex-shrink-0"
        />
        <div className="flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-gray-400">{name}</span>
            <span className="text-[10px] text-gray-500">10:05 AM</span>
          </div>
          <div className="text-sm text-white mt-0.5">{message}</div>
        </div>
      </div>
    </div>

    {/* Optional Second Message (without meta) */}
    {secondMessage && (
      <div className="px-4 md:px-10 transition-colors hover:bg-theme-border duration-200">
        <div className="flex gap-2">
          <div className="w-10 flex-shrink-0" />
          <div className="text-sm text-white">{secondMessage}</div>
        </div>
      </div>
    )}
  </div>
);
