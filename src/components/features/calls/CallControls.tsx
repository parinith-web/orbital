"use client";

import { useState } from "react";
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
 * H7.2 — the old "Play Anomaly" button (and its `signalSessionId`/
 * `isStartingSignal`/`createSignalSession` plumbing) is gone. It used to
 * be the only way to surface Anomaly at all (opening `SignalPanel` as a
 * modal over the call), which made sense before H7 gave the game a
 * permanent home. Now that `GameStage` shows the room's live session the
 * instant you're in the room — call joined or not — a second button here
 * that reopened a duplicate, independently-mutating view of the same
 * session would just be confusing (and race-prone: two clients of the
 * same `session_id` calling `createSession`/`endSession` from two
 * different panels). `useUIStore`'s `signalSessionId`/`isSignalPanelOpen`
 * fields and `SignalPanel.tsx` itself are untouched, just no longer
 * reachable from anywhere — see `CallOverlay.tsx`'s comment for the rest.
 *
 * Session 4 (CallPanel port) — was an `absolute bottom-2` floating pill
 * centered over the participant grid, a holdover from when this sat over
 * a full-bleed video area. Now that `CallOverlay` is a real flex column
 * (see that file's comment), this renders as a normal-flow bottom dock
 * bar — full-width, bordered on top — matching the mockup's `CallPanel`
 * control dock. Same buttons, same handlers, just no longer floating.
 */
export const CallControls = () => {
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
  // F2c: CallControls had no pending-guard on any of its non-Anomaly buttons
  // before this audit, unlike every Anomaly-feature button (RoundView's
  // isStarting, VotingPanel's pendingFor, SignalPanel's isEnding, this
  // file's own isStartingSignal). Two of these three were genuine gaps,
  // not just missing polish:
  //   - isLeaving: leaveCall() (callStore.ts) only refuses re-entry once
  //     status is back to "idle" — a second click landing while status is
  //     still "leaving" sails straight through and re-runs
  //     callClient.disconnect() + leaveCallMutation a second time for the
  //     same call. callId itself doesn't clear until leaveCall() finishes,
  //     so a rapid double-click before that resolves hits this every time.
  //   - isTogglingVideo / isTogglingScreenShare: both guard their "turn on"
  //     branch on a flag (localVideoStream / isScreenSharing) that CallClient
  //     only flips AFTER an awaited getUserMedia/getDisplayMedia call
  //     resolves — a double-click during that permission prompt re-enters
  //     the same "turn on" branch twice concurrently (duplicate
  //     getUserMedia/getDisplayMedia calls, potentially duplicate tracks
  //     added to the peer connection).
  // toggleMute deliberately has NO new guard: its callStore body has no
  // `await` before flipping track.enabled, so it always resolves in the
  // same microtask — there's no window for a second click to land mid-flight,
  // confirmed by reading client.ts's toggleMute body directly rather than
  // assuming parity with video/screen-share.
  const [isLeaving, setIsLeaving] = useState(false);
  const [isTogglingVideo, setIsTogglingVideo] = useState(false);
  const [isTogglingScreenShare, setIsTogglingScreenShare] = useState(false);

  const handleLeave = async () => {
    if (!callId || isLeaving) return;
    setIsLeaving(true);
    try {
      await leaveCurrentSession(callId);
      setCallOverlayOpen(false);
    } catch {
      // isLeaving reset in finally so a genuinely failed leave can be retried
    } finally {
      setIsLeaving(false);
    }
  };

  const handleToggleVideo = async () => {
    if (isTogglingVideo) return;
    setIsTogglingVideo(true);
    try {
      await toggleVideo();
    } finally {
      setIsTogglingVideo(false);
    }
  };

  const handleToggleScreenShare = async () => {
    if (isTogglingScreenShare) return;
    setIsTogglingScreenShare(true);
    try {
      await toggleScreenShare();
    } finally {
      setIsTogglingScreenShare(false);
    }
  };

  const audioDevices = availableDevices.filter((d) => d.kind === "audioinput");
  const videoDevices = availableDevices.filter((d) => d.kind === "videoinput");

  return (
    <div className="w-full shrink-0 flex items-center justify-center gap-2 md:gap-3 px-4 py-3 border-t border-theme-border bg-theme-surface">
      <Button
        variant={isMuted ? "destructive2" : "other"}
        size={"iconMd"}
        className="rounded-xl"
        onClick={toggleMute}
        tooltip={isMuted ? "Unmute" : "Mute"}
        tooltipSide="top"
      >
        <HugeiconsIcon
          icon={isMuted ? MicOff02Icon : Mic02Icon}
          className="w-4 h-4"
        />
      </Button>

      <Button
        variant={isVideoOn ? "other" : "destructive2"}
        size="iconMd"
        className="rounded-xl"
        onClick={handleToggleVideo}
        disabled={isTogglingVideo}
        tooltip={isVideoOn ? "Turn Off Video" : "Turn On Video"}
        tooltipSide="top"
      >
        <HugeiconsIcon
          icon={isVideoOn ? Video01Icon : VideoOffIcon}
          className="w-4 h-4"
        />
      </Button>

      <Button
        variant={isScreenSharing ? "destructive2" : "other"}
        size="iconMd"
        className="rounded-xl"
        onClick={handleToggleScreenShare}
        disabled={isTogglingScreenShare}
        tooltip={isScreenSharing ? "Stop Sharing" : "Share Screen"}
        tooltipSide="top"
      >
        <HugeiconsIcon
          icon={isScreenSharing ? ComputerRemoveIcon : ComputerScreenShareIcon}
          className="w-4 h-4"
        />
      </Button>

      <Popover onOpenChange={(open) => open && refreshDevices()}>
        <PopoverTrigger asChild>
          <Button
            variant="other"
            size="iconMd"
            className="rounded-xl"
            tooltip="Settings"
            tooltipSide="top"
          >
            <HugeiconsIcon icon={Settings02Icon} className="w-4 h-4" />
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
        size="iconMd"
        className="rounded-xl"
        onClick={handleLeave}
        disabled={isLeaving}
        tooltip="Leave Call"
        tooltipSide="top"
      >
        <HugeiconsIcon icon={CallEnd01Icon} className="w-4 h-4" />
      </Button>
    </div>
  );
};
