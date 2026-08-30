"use client";

import Image from "next/image";

export const AvatarStatusMock = ({
  avatar = "/assets/bu.png",
  className,
}: {
  avatar?: string;
  className?: string;
}) => (
  <div
    className={`flex-shrink-0 bg-[#101010] border border-[#242424] pr-6 p-3 rounded-2xl shadow-2xl backdrop-blur-md ${className || "w-fit"}`}
  >
    <span className="text-xs text-gray-300 pl-1 block mb-2">Avatar</span>
    <div className="group relative">
      <Image
        src={avatar}
        alt="Profile"
        width={60}
        height={60}
        className="rounded-[12px] w-16 h-16"
      />
    </div>
  </div>
);
