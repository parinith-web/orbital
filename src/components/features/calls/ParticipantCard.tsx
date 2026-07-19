"use client";

import { useEffect, useRef, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MicOff02Icon,
  VideoOffIcon,
  ComputerScreenShareIcon,
  FullscreenIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui";

interface ParticipantCardProps {
  userId: string;
  profile?: any;
  isSpeaking?: boolean;
  videoStream?: MediaStream | null;
  isLocal?: boolean;
  isVideoOn: boolean;
  isMuted: boolean;
  isScreenShare?: boolean;
}

export const ParticipantCard = ({
  userId,
  profile,
  isSpeaking = false,
  videoStream = null,
  isLocal = false,
  isVideoOn,
  isMuted,
  isScreenShare = false,
}: ParticipantCardProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const name = profile?.username || "Connecting...";
  const avatarUrl = profile?.avatar;

  // Screen share cards always show video; regular cards use server-authoritative state
  const hasVideo = isScreenShare ? !!videoStream : isVideoOn && !!videoStream;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (hasVideo && videoStream) {
      if (video.srcObject !== videoStream) {
        video.srcObject = videoStream;
      }
      // Ensure it's playing
      void video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [hasVideo, videoStream]);

  const toggleFullscreen = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await cardRef.current.requestFullscreen();
      }
    } catch (err) {
      console.error("[ParticipantCard] Fullscreen error:", err);
    }
  }, []);

  return (
    <div
      ref={cardRef}
      className={`relative w-full h-full bg-theme-base rounded-2xl overflow-hidden flex items-center justify-center border transition-all duration-500 border-theme-border ${isScreenShare ? "group" : ""}`}
    >
      {/* Video element - always present to prevent flickering from mount/unmount */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full ${isScreenShare ? "object-contain" : "object-cover scale-110"} transition-opacity duration-500 ${hasVideo ? "opacity-100" : "opacity-0 pointer-events-none"}`}
      />

      {/* Avatar/Placeholder - shown when video is off (only for non-screen-share cards) */}
      {!hasVideo && !isScreenShare && (
        <div className="flex flex-col items-center justify-center transition-opacity duration-500">
          {avatarUrl ? (
            <div
              className={`relative rounded-full w-32 h-32 transition-transform duration-500 `}
            >
              <div
                className={`absolute inset-0 rounded-full theme-accent opacity-0 transition-opacity duration-300 ${isSpeaking ? "opacity-20 blur-xl animate-pulse" : ""}`}
              />
              <div
                className={`relative w-full h-full rounded-full overflow-hidden border-2 ${isSpeaking ? "border-theme-accent" : "border-theme-border"} transition-colors duration-300`}
              >
                <Image
                  src={avatarUrl}
                  alt={name}
                  fill
                  sizes="(max-width: 768px) 100%, (max-width: 1024px) 100%, 100%"
                  className="object-cover"
                />
              </div>
            </div>
          ) : (
            <div
              className={`w-32 h-32 rounded-full bg-theme-base flex items-center justify-center text-4xl font-bold text-white border-4 ${isSpeaking ? "border-theme-accent scale-110" : "border-theme-border"} transition-all duration-500 shadow-2xl`}
            >
              {name[0].toUpperCase()}
            </div>
          )}
        </div>
      )}

      {/* Screen share waiting state */}
      {!hasVideo && isScreenShare && (
        <div className="flex flex-col items-center justify-center gap-3 text-gray-400">
          <HugeiconsIcon
            icon={ComputerScreenShareIcon}
            className="w-12 h-12 opacity-50"
          />
          <span className="text-sm font-medium">Waiting for screen...</span>
        </div>
      )}

      {/* Fullscreen button - shown on hover for screen share cards */}
      {isScreenShare && hasVideo && (
        <Button
          onClick={toggleFullscreen}
          className="absolute top-3 right-3 rounded-lg cursor-pointer z-10 opacity-0 group-hover:opacity-100"
          title="Fullscreen"
          variant="secondary"
          size="iconSm"
        >
          <HugeiconsIcon icon={FullscreenIcon} className="w-4 h-4" />
        </Button>
      )}

      {/* Name Label */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 px-3 py-1.5 rounded-lg text-xs font-medium text-white ">
        <span>{isScreenShare ? `${name}'s screen` : name}</span>
        <div className=" flex items-center">
          {!isScreenShare && isMuted && (
            <div className="p-1.5 rounded-lg">
              <HugeiconsIcon
                icon={MicOff02Icon}
                className="w-3.5 h-3.5 text-gray-300"
              />
            </div>
          )}
          {!isScreenShare && !hasVideo && (
            <div className="p-1.5 rounded-lg">
              <HugeiconsIcon
                icon={VideoOffIcon}
                className="w-3.5 h-3.5 text-gray-300"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
