"use client";

import { useState, useEffect, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FullscreenIcon,
  CallEnd01Icon,
  CallIncoming01Icon,
} from "@hugeicons/core-free-icons";
import { useCallSessionActions } from "@/hooks";
import { useUserStore } from "@/store/useUserStore";
import { useCallStore } from "@/store/callStore";
import { formatDuration } from "@/lib/utils/date";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUIStore } from "@/store/uiStore";
import { useRooms } from "@/contexts/roomContext";
import { useRoomCallContext } from "@/contexts/CallContext";
import AvatarStack from "@/components/ui/AvatarStack";
import type { CallRecord } from "@/lib/types/call";
import { Button } from "@/components/ui";

interface ActiveCallPanelProps {
  call: CallRecord;
  conversationName?: string;
  onLeave: () => void;
}

export default function ActiveCallPanel({
  call,
  conversationName,
  onLeave,
}: ActiveCallPanelProps) {
  const user = useUserStore((s) => s.user);
  const [duration, setDuration] = useState(formatDuration(call.startedAt));
  const [isLeaving, setIsLeaving] = useState(false);

  const { rooms } = useRooms();
  const roomCallContext = useRoomCallContext();
  const { setModal, setCallOverlayOpen } = useUIStore();
  const { joinExistingSession, leaveCurrentSession } = useCallSessionActions();
  const {
    status,
    callId: activeCallId,
    error: callError,
    syncParticipants,
  } = useCallStore();

  const isCallJoined = status === "joined" && activeCallId === call._id;
  const isThisCallConnecting =
    status === "joining" && activeCallId === call._id;
  const hasOtherActiveSession =
    !!activeCallId &&
    activeCallId !== call._id &&
    (status === "joined" || status === "joining");
  
  const participantIds = useMemo(() => call.participants, [call.participants]);
  
  const fetchedProfiles = useQuery(api.users.getUsersByExternalIds, { 
    user_ids: participantIds 
  });

  const participantProfiles = useMemo(() => {
    if (roomCallContext?.participantProfiles) {
      return participantIds.map(id => roomCallContext.participantProfiles[id]).filter(Boolean);
    }
    return fetchedProfiles || [];
  }, [roomCallContext?.participantProfiles, participantIds, fetchedProfiles]);

  // Synchronize participants with PeerJS client whenever the Convex list changes
  useEffect(() => {
    if (isCallJoined && call.activePeerIds) {
      syncParticipants(call.activePeerIds);
    }
  }, [isCallJoined, call.activePeerIds, syncParticipants]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDuration(formatDuration(call.startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [call.startedAt]);

  const handleJoin = async () => {
    if (isCallJoined) return;

    if (hasOtherActiveSession) {
      const roomData = rooms.find((r) => r.room_id === call.roomId);
      const resolvedName =
        conversationName ||
        roomData?.Rooms?.room_name ||
        "Unknown Conversation";
      setModal("SWITCH_CALL", {
        newCallId: call._id,
        newRoomId: call.roomId,
        newRoomName: resolvedName,
        oldCallId: activeCallId,
      });
      return;
    }

    try {
      const roomData = rooms.find((r) => r.room_id === call.roomId);
      await joinExistingSession({
        callId: call._id,
        userId: user?.user_id || "",
        room: {
          id: call.roomId,
          name:
            conversationName ||
            roomData?.Rooms?.room_name ||
            "Unknown Conversation",
        },
        startedAt: call.startedAt,
      });
    } catch (error) {
      console.error("[ActiveCallPanel] Failed to join:", error);
    }
  };

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await leaveCurrentSession(call._id);
      onLeave();
    } catch (error) {
      console.error("[ActiveCallPanel] Failed to leave:", error);
      setIsLeaving(false);
    }
  };

  if (!isCallJoined) {
    return (
      <div className="p-3 border-b border-theme-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">Active Call</span>
          </div>
          <span className="text-xs text-gray-400">{duration}</span>
        </div>

        <div className="flex items-center mb-3">
          <AvatarStack users={participantProfiles} size={24} showCount />
        </div>

        <button
          onClick={handleJoin}
          disabled={isThisCallConnecting || isCallJoined}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 text-white transition-colors hover:bg-green-700 disabled:opacity-50"
        >
          <HugeiconsIcon
            icon={CallIncoming01Icon}
            className={`w-4 h-4 ${isThisCallConnecting ? "animate-bounce" : ""}`}
          />
          <span className="text-sm">
            {isThisCallConnecting ? "Connecting to call..." : "Join Call"}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 border-b border-theme-border">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white">Active Call</span>
        </div>
        <span className="text-xs text-gray-400">{duration}</span>
      </div>

      <div className="flex items-center mb-3">
        <AvatarStack users={participantProfiles} size={24} showCount />
      </div>

      <div className="flex gap-2">
        <Button
          variant="other"
          size="md"
          onClick={() => setCallOverlayOpen(true)}
          className="rounded-lg gap-2 w-full"
        >
          <HugeiconsIcon icon={FullscreenIcon} className="w-4 h-4" />
          <span className="text-sm">Open</span>
        </Button>
        <Button
          variant="destructive2"
          size="md"
          onClick={handleLeave}
          className="rounded-lg gap-2 w-full"
        >
          <HugeiconsIcon icon={CallEnd01Icon} className="w-4 h-4" />
          <span className="text-sm">Leave</span>
        </Button>
      </div>
    </div>
  );
}
