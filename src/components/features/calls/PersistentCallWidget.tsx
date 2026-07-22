"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mic02Icon,
  MicOff02Icon,
  Video01Icon,
  VideoOffIcon,
  CallEnd01Icon,
  ComputerRemoveIcon
} from "@hugeicons/core-free-icons";
import { useCallStore } from "@/store/callStore";
import { useRouter } from "next/navigation";
import { useCallSessionActions, useCalls } from "@/hooks";
import { memo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import AvatarStack from "@/components/ui/AvatarStack";
import { Button } from "@/components/ui/button/Button";
import { PUBLIC_LOBBY_ROOM_ID_PREFIX } from "@/convex/games/lobbyConfig";
import { ROUTES } from "@/lib/constants/routes";

const PersistentCallWidget = () => {
  const { status, roomName, actualRoomId, callId, isMuted, toggleMute, isVideoOn, toggleVideo, isScreenSharing, toggleScreenShare } =
    useCallStore();
  const { leaveCurrentSession } = useCallSessionActions();
  const router = useRouter();
  const { activeCalls } = useCalls(actualRoomId || "");
  const activeCall = activeCalls.find((call) => call._id === callId);
  const participantProfiles =
    useQuery(
      api.users.getUsersByExternalIds,
      activeCall
        ? { user_ids: activeCall.participants }
        : "skip",
    ) || [];

  if (status !== "joined") return null;

  const handleLeave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!callId) return;

    try {
      await leaveCurrentSession(callId);
    } catch {
      // Best effort widget leave
    }
  };

  const handleClick = () => {
    if (!actualRoomId) return;

    // G2: a public Anomaly lobby's call is keyed to a synthetic room_id
    // (`generateSessionId(PUBLIC_LOBBY_ROOM_ID_PREFIX)`, in
    // convex/publicMatchmaking.ts) that has no corresponding row in the
    // `rooms` table — routing there like a real room 404s/breaks. That
    // call's own UI lives inline on /portal/anomaly (PublicLobbyVoice,
    // mounted by PublicLobbyScreen), not behind CallOverlay the way a real
    // room's call is, so this also skips the room-call-specific sidebar/
    // overlay side effects below, which don't apply to it.
    if (actualRoomId.startsWith(`${PUBLIC_LOBBY_ROOM_ID_PREFIX}_`)) {
      router.push(ROUTES.PORTAL_ANOMALY);
      return;
    }

    if (actualRoomId.startsWith("direct_")) {
      router.push("/portal");
    } else {
      // H7.2: no more setSidebarOpen/setSidebarTab("calls")/
      // setCallOverlayOpen(true) here — the room page's call section
      // (GameRoomSidePanel → CallOverlay) shows itself automatically once
      // joined, it's not a details-tab or full-screen state to flip on.
      router.push(`/portal/room/${actualRoomId}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex justify-between bg-theme-hover items-center cursor-pointer ease-in-out rounded-lg w-60 px-3 py-2 group"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 text-gray-100">
        <span className="truncate text-sm font-medium max-w-[96px]">
          {roomName || "Current Call"}
        </span>
        <div className="min-w-0 flex-1">
          <AvatarStack users={participantProfiles} size={20} limit={3} />
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant={isMuted ? "destructive2" : "other"}
          size="iconMd"
          onClick={(e) => {
            e.stopPropagation();
            toggleMute();
          }}
          tooltip={isMuted ? "Unmute" : "Mute"}
          className={`rounded-lg ${isMuted ? "" : "text-gray-200"}`}
        >
          <HugeiconsIcon icon={isMuted ? MicOff02Icon : Mic02Icon} className="w-4 h-4" />
        </Button>

        <Button
          variant={isVideoOn ? "other" : "destructive2"}
          size="iconMd"
          onClick={(e) => {
            e.stopPropagation();
            toggleVideo();
          }}
          tooltip={isVideoOn ? "Turn off Video" : "Turn on Video"}
          className={`rounded-lg ${!isVideoOn ? "" : "text-gray-200"}`}
        >
          <HugeiconsIcon icon={isVideoOn ? Video01Icon : VideoOffIcon} className="w-4 h-4" />
        </Button>
        <Button
          variant="destructive2"
          size="iconMd"
          onClick={(e) => {
            e.stopPropagation();
            toggleScreenShare();
          }}
          tooltip={"Stop Screen Sharing"}
          className={`rounded-lg ${isScreenSharing ? "block" : "hidden"}`}
        >
          <HugeiconsIcon icon={ComputerRemoveIcon} className="w-4 h-4" />
        </Button>

        <Button
          variant="destructive2"
          size="iconMd"
          onClick={handleLeave}
          tooltip="Leave Call"
          className="rounded-lg"
        >
          <HugeiconsIcon icon={CallEnd01Icon} className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default memo(PersistentCallWidget);
