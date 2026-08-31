"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { MicOff02Icon, VideoOffIcon } from "@hugeicons/core-free-icons";

/**
 * Landing-page-only stand-in for `ParticipantCard` (see AppUICalls.tsx).
 * Deliberately NOT the real, shared `ParticipantCard` component — this is
 * a marketing-page-specific tile so the visual redesign here (square
 * avatars, whole-tile speaking outline, icons beside the avatar) never
 * touches the live call feature.
 */

interface LandingParticipantTileProps {
  username: string;
  avatar?: string;
  isMuted?: boolean;
  isSpeaking?: boolean;
}

export function LandingParticipantTile({
  username,
  avatar,
  isMuted = false,
  isSpeaking = false,
}: LandingParticipantTileProps) {
  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl border-2 bg-theme-base p-3 transition-colors duration-300 ${
        isSpeaking ? "border-theme-accent" : "border-theme-border"
      }`}
    >
      {/* Main avatar — square, no encircling ring */}
      <div className="flex flex-1 items-center justify-center">
        {avatar ? (
          <div className="relative h-14 w-14 overflow-hidden rounded-lg sm:h-16 sm:w-16">
            <Image src={avatar} alt={username} fill sizes="64px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-theme-surface text-lg font-bold text-white sm:h-16 sm:w-16">
            {username[0]?.toUpperCase()}
          </div>
        )}
      </div>

      {/* Bottom row: small square avatar + name on the left, mic/video status to the right */}
      <div className="flex w-full flex-none items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="relative h-4 w-4 flex-none overflow-hidden rounded-[4px]">
            {avatar ? (
              <Image src={avatar} alt="" fill sizes="16px" className="object-cover" />
            ) : (
              <div className="h-full w-full bg-theme-surface" />
            )}
          </div>
          <span className="truncate text-xs font-medium text-white">{username}</span>
        </div>

        <div className="flex flex-none items-center gap-1">
          {isMuted && (
            <HugeiconsIcon icon={MicOff02Icon} className="h-3.5 w-3.5 text-gray-300" />
          )}
          <HugeiconsIcon icon={VideoOffIcon} className="h-3.5 w-3.5 text-gray-300" />
        </div>
      </div>
    </div>
  );
}

export default LandingParticipantTile;
