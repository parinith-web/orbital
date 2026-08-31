"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon } from "@hugeicons/core-free-icons";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { getAvatarUrl } from "@/lib/utils/avatar";

/**
 * This panel doesn't call Convex — no live game session on the marketing
 * page — so it's a static snapshot of Anomaly's real `RoundView` UI: same
 * round pill, word card, and currently-speaking row (with the same
 * `CountdownRing` treatment), just fed a fixed word/speaker instead of a
 * live query. See `RoundView.tsx`'s own "speaking" branch for the source
 * of truth this mirrors.
 */

function CountdownRing({
  secondsLeft,
  percent,
  size = 40,
}: {
  secondsLeft: number;
  percent: number;
  size?: number;
}) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--theme-border))" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--theme-accent-hsl))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="absolute text-[10px] font-medium text-white tabular-nums">{secondsLeft}</span>
    </div>
  );
}

const DEMO_WORD = "COMET";
const DEMO_SPEAKER = { username: "Wave", avatar: "/assets/sq.png" };

export function AppUIGameNight({ className }: { className?: string }) {
  return (
    <div className={`flex w-full flex-col items-center gap-5 max-w-md mx-auto ${className || ""}`}>
      <div className="flex items-center gap-2 rounded-full border border-theme-border bg-theme-hover px-3.5 py-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        <span className="text-xs font-semibold tracking-wide text-gray-300">Round 2</span>
      </div>

      <div
        className="w-full rounded-2xl border border-theme-border bg-theme-base px-6 py-6 flex flex-col items-center gap-1.5"
        style={{ boxShadow: "0 0 35px -8px hsl(var(--theme-accent-hsl) / 0.3)" }}
      >
        <div className="text-[10px] uppercase tracking-[0.2em] text-theme-accent font-medium">Your word</div>
        <div className="text-2xl font-bold text-white">{DEMO_WORD}</div>
      </div>

      <div className="w-full flex items-center justify-between rounded-2xl border border-theme-border bg-theme-hover px-4 py-3">
        <div className="flex items-center gap-2.5">
          <HugeiconsIcon icon={Mic01Icon} className="w-4 h-4 text-theme-accent" />
          <div className="flex items-center gap-2">
            <div className="relative">
              <Image
                src={getAvatarUrl(DEMO_SPEAKER.avatar, DEMO_SPEAKER.username)}
                alt={DEMO_SPEAKER.username}
                width={28}
                height={28}
                className="rounded-full object-cover bg-theme-base ring-2 ring-theme-accent"
              />
              <StatusIndicator isOnline isAway={false} />
            </div>
            <span className="text-sm text-white font-medium">{DEMO_SPEAKER.username}</span>
          </div>
        </div>
        <CountdownRing secondsLeft={12} percent={40} />
      </div>
    </div>
  );
}

export default AppUIGameNight;
