"use client";

import { useCallStore } from "@/store/callStore";
import { useUIStore } from "@/store/uiStore";
import { useCallSessionActions } from "@/hooks";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import {
  Mic02Icon,
  MicOff02Icon,
  Video01Icon,
  VideoOffIcon,
  CallEnd01Icon,
  ComputerScreenShareIcon,
  ComputerRemoveIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

/**
 * Session 3 — ported verbatim from Portal's `CallControls.tsx`.
 *
 * Forked (not shared) for the same reason as `RoomParticipantGrid`:
 * Anomaly's `PublicCallPanel` imports the existing
 * `@/components/features/calls/CallControls` directly, so this copy keeps
 * plain chat/call rooms fully decoupled from anything the public lobby
 * relies on.
 */
export const RoomCallControls = () => {
  const {
    isMuted,
    toggleMute,
    isVideoOn,
    toggleVideo,
    isScreenSharing,
    toggleScreenShare,
    callId,
    availableDevices,
    refreshDevices,
    setAudioSource,
    setVideoSource,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
  } = useCallStore();
  const { setCallOverlayOpen } = useUIStore();
  const { leaveCurrentSession } = useCallSessionActions();

  const handleLeave = async () => {
    if (!callId) return;
    try {
      await leaveCurrentSession(callId);
      setCallOverlayOpen(false);
    } catch {}
  };

  const audioDevices = availableDevices.filter((d) => d.kind === "audioinput");
  const videoDevices = availableDevices.filter((d) => d.kind === "videoinput");

  return (
    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 md:scale-100 scale-90 bg-theme-surface p-3 rounded-2xl flex items-center gap-2 md:gap-3 border border-theme-border">
      <Button
        variant={isMuted ? "destructive2" : "other"}
        size={"iconLg"}
        className="rounded-2xl"
        onClick={toggleMute}
        tooltip={isMuted ? "Unmute" : "Mute"}
        tooltipSide="top"
      >
        <HugeiconsIcon
          icon={isMuted ? MicOff02Icon : Mic02Icon}
          className="w-5 h-5"
        />
      </Button>

      <Button
        variant={isVideoOn ? "other" : "destructive2"}
        size="iconLg"
        className="rounded-2xl"
        onClick={toggleVideo}
        tooltip={isVideoOn ? "Turn Off Video" : "Turn On Video"}
        tooltipSide="top"
      >
        <HugeiconsIcon
          icon={isVideoOn ? Video01Icon : VideoOffIcon}
          className="w-5 h-5"
        />
      </Button>

      <Button
        variant={isScreenSharing ? "destructive2" : "other"}
        size="iconLg"
        className="rounded-2xl"
        onClick={toggleScreenShare}
        tooltip={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        tooltipSide="top"
      >
        <HugeiconsIcon
          icon={isScreenSharing ? ComputerRemoveIcon : ComputerScreenShareIcon}
          className="w-5 h-5"
        />
      </Button>

      <Popover onOpenChange={(open) => open && refreshDevices()}>
        <PopoverTrigger asChild>
          <Button
            variant="other"
            size="iconLg"
            className="rounded-2xl"
            tooltip="Settings"
            tooltipSide="top"
          >
            <HugeiconsIcon icon={Settings02Icon} className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[300px] mb-4 p-4"
          side="top"
          align="center"
          sideOffset={0}
        >
          <div className="space-y-5">
            {/* Audio Section */}
            <div className="space-y-2">
              <span className="text-xs text-gray-400 px-1">Microphone</span>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {audioDevices.length > 0 ? (
                  audioDevices.map((device) => {
                    const isActive = selectedAudioDeviceId === device.deviceId;
                    return (
                      <Button
                        key={device.deviceId}
                        variant={isActive ? "primary" : "other"}
                        size="md"
                        onClick={() => setAudioSource(device.deviceId)}
                        className={cn(
                          "w-full flex items-center justify-between h-auto",
                        )}
                      >
                        <span className="text-xs truncate pr-3 flex-1 text-left">
                          {device.label ||
                            `Microphone ${device.deviceId.slice(0, 5)}`}
                        </span>
                      </Button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center bg-theme-hover rounded-lg border border-dashed border-white/5">
                    <span className="text-[10px] text-gray-500">
                      No microphones
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Video Section */}
            <div className="space-y-2">
              <span className="text-xs text-gray-400 px-1">Camera</span>
              <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
                {videoDevices.length > 0 ? (
                  videoDevices.map((device) => {
                    const isActive = selectedVideoDeviceId === device.deviceId;
                    return (
                      <Button
                        key={device.deviceId}
                        variant={isActive ? "primary" : "other"}
                        size="md"
                        onClick={() => setVideoSource(device.deviceId)}
                        className={cn(
                          "w-full flex items-center justify-between h-auto",
                        )}
                      >
                        <span className="text-xs truncate pr-3 flex-1 text-left">
                          {device.label ||
                            `Camera ${device.deviceId.slice(0, 5)}`}
                        </span>
                      </Button>
                    );
                  })
                ) : (
                  <div className="p-3 text-center bg-theme-hover rounded-lg border border-dashed border-white/5">
                    <span className="text-[10px] text-gray-500">
                      No cameras
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant="destructive2"
        size="iconLg"
        className="rounded-2xl"
        onClick={handleLeave}
        tooltip="Leave Call"
        tooltipSide="top"
      >
        <HugeiconsIcon icon={CallEnd01Icon} className="w-5 h-5" />
      </Button>
    </div>
  );
};
