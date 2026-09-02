"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { CallIcon, Video01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";

interface CallHistoryEntry {
  type: "audio" | "video";
  time: string;
  duration: string;
  participants: number;
  avatars: string[];
}

const CALLS: CallHistoryEntry[] = [
  {
    type: "video",
    time: "12:30 PM",
    duration: "15m",
    participants: 3,
    avatars: ["/assets/pi.png", "/assets/ch.png", "/assets/sq.png"],
  },
  {
    type: "audio",
    time: "10:15 AM",
    duration: "8m",
    participants: 2,
    avatars: ["/assets/sq.png", "/assets/bu.png"],
  },
  {
    type: "video",
    time: "Yesterday",
    duration: "42m",
    participants: 4,
    avatars: ["/assets/pi.png", "/assets/ch.png", "/assets/sq.png", "/assets/bu.png"],
  },
];

export const CallHistoryMock = ({ className }: { className?: string }) => (
  <div
    className={`bg-[#101010] border border-[#242424] shadow-2xl backdrop-blur-md rounded-xl overflow-hidden select-none ${className || "w-72"}`}
  >
    <div className="px-3 py-2 text-xs font-bold text-gray-500 bg-[#0a0a0a]/50 text-left">
      Call History
    </div>
    <div className="max-h-64 overflow-hidden">
      {CALLS.map((call, i) => (
        <div
          key={i}
          className={`px-3 py-3 flex items-center gap-3 ${
            i !== CALLS.length - 1 ? "border-b border-[#242424]/30" : ""
          }`}
        >
          <div
            className={`flex-none w-8 h-8 rounded-lg flex items-center justify-center ${
              call.type === "video"
                ? "bg-blue-500/15 text-blue-400"
                : "bg-emerald-500/15 text-emerald-400"
            }`}
          >
            <HugeiconsIcon
              icon={call.type === "video" ? Video01Icon : CallIcon}
              className="w-4 h-4"
            />
          </div>

          <div className="flex-1 min-w-0 text-left">
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-2">
                {call.avatars.slice(0, 3).map((src, j) => (
                  <Image
                    key={j}
                    src={src}
                    alt=""
                    width={18}
                    height={18}
                    className="rounded-full ring-2 ring-[#101010]"
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-500 flex items-center gap-1 ml-1">
                <HugeiconsIcon icon={UserGroupIcon} className="w-3 h-3" />
                {call.participants} joined
              </span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              {call.time} • {call.duration}
            </div>
          </div>

          <span className="flex-none text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {call.type}
          </span>
        </div>
      ))}
    </div>
  </div>
);
