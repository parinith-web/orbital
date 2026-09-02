"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CallIcon,
  Video01Icon,
  UserGroupIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

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
    avatars: [
      "/assets/pi.png",
      "/assets/ch.png",
      "/assets/sq.png",
      "/assets/bu.png",
    ],
  },
];

// Full right-hand "Calls" panel — mirrors the production sidebar's shape
// (header with title + close, scrollable log, footer CTA) rather than a
// small anchored dropdown, so the landing mock matches how the real app
// surfaces call history.
export const CallHistoryMock = ({ className }: { className?: string }) => (
  <div
    className={`w-[280px] flex-none bg-theme-surface border-theme-border border-l hidden md:flex flex-col overflow-hidden text-white select-none ${className || ""}`}
  >
    <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-theme-border">
      <span className="text-sm font-medium">Calls</span>
      <div className="w-6 h-6 flex items-center justify-center text-white/50">
        <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
      </div>
    </div>

    <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-2 space-y-1">
      {CALLS.map((call, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-theme-hover"
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
                    width={16}
                    height={16}
                    className="rounded-full ring-2 ring-theme-surface"
                  />
                ))}
              </div>
              <span className="text-[10px] text-gray-500 flex items-center gap-1">
                <HugeiconsIcon icon={UserGroupIcon} className="w-3 h-3" />
                {call.participants} joined
              </span>
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              {call.time} • {call.duration}
            </div>
          </div>

          <span className="flex-none text-[9px] font-medium uppercase tracking-wide text-gray-500">
            {call.type}
          </span>
        </div>
      ))}
    </div>

    <div className="flex-none p-3 border-t border-theme-border">
      <div className="w-full flex items-center justify-center gap-2 rounded-lg bg-theme-hover py-2.5 text-sm font-medium text-white cursor-default">
        <HugeiconsIcon icon={CallIcon} className="w-4 h-4" />
        Start New Call
      </div>
    </div>
  </div>
);
