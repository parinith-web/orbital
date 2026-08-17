"use client";

import { useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { useCalls, useCallSessionActions } from "@/hooks";
import { useCallStore } from "@/store/callStore";
import { useUserStore } from "@/store/useUserStore";
import { RoomCallProvider } from "@/contexts/CallContext";
import { ParticipantGrid } from "@/components/features/calls/ParticipantGrid";
import { CallControls } from "@/components/features/calls/CallControls";
import { CallOverlayHeader } from "@/components/features/calls/CallOverlayHeader";

/**
 * Fixes the gap the Anomaly mockup calls for but "Play Online" never got:
 * a left-hand participant video panel. A private room already gets this
 * for free from `CallPanel.tsx` (mounted by `[room_id]/layout.tsx`), but
 * `/orbital/anomaly` sits under the plain `(main)` shell (just
 * `LeftSidebar` + content — see that layout's own comment) and, before
 * this, only rendered `PublicLobbyVoice`'s compact mute-only status strip
 * in place of it — no video tiles, no camera/screen-share controls.
 *
 * `PublicLobbyVoice`'s old header claimed reusing `CallOverlay` (the
 * private room's video panel) wasn't possible because it also renders a
 * "Play Anomaly" button and `SignalPanel`'s round UI. Both are gone as of
 * H7.2 (`CallControls.tsx`'s own header confirms this) — `CallOverlay` is
 * just `CallOverlayHeader + ParticipantGrid + CallControls` today, none of
 * which are round-UI or session-control components. It's still not reused
 * directly here only because it gates on `pathname.includes("/orbital/room/…")`
 * (see `CallOverlay.tsx`), which is never true on `/orbital/anomaly` — so
 * this composes the same three primitives directly instead, sidestepping
 * that route check rather than fighting it.
 *
 * Wrapped in `RoomCallProvider` (keyed to the public session's synthetic
 * `room_id`, same as `PublicLobbyVoice` used) purely so `ParticipantGrid`
 * gets real usernames/avatars via that provider's `getUsersByExternalIds`
 * lookup — without it, `ParticipantGrid` still works (it falls back to a
 * direct, provider-less `useCalls` query, see that file's own fallback),
 * it would just show every tile as "Connecting..." forever since profile
 * data specifically comes from the provider, not the calls query itself.
 *
 * AUTO-JOIN: still exactly `PublicLobbyVoice`'s own D1/E3 behavior — first
 * player into a newly-formed public room starts the call, everyone else
 * joins the one already there. Kept inline here (not re-imported from
 * `PublicLobbyVoice.tsx`, which still exists for `PostGameActions.tsx`'s
 * doc-comment reference) since the render output is now different enough
 * that layering one on top of the other would be more confusing than
 * duplicating ~20 lines of effect.
 */
function useAutoJoinPublicVoice(roomId: string, roomName: string) {
  const user = useUserStore((s) => s.user);
  const { activeCalls, isLoading } = useCalls(roomId);
  const { startAndJoinCall, joinExistingSession, leaveCurrentSession } =
    useCallSessionActions();
  const status = useCallStore((s) => s.status);
  const actualRoomId = useCallStore((s) => s.actualRoomId);

  const hasAttempted = useRef(false);
  const isThisRoomJoined =
    actualRoomId === roomId && (status === "joined" || status === "joining");
  const isInDifferentCall =
    !!actualRoomId &&
    actualRoomId !== roomId &&
    (status === "joined" || status === "joining");

  useEffect(() => {
    if (isLoading || hasAttempted.current || isThisRoomJoined || !user) return;
    if (isInDifferentCall) return;

    hasAttempted.current = true;
    (async () => {
      try {
        const existing = activeCalls[0];
        if (existing) {
          await joinExistingSession({
            callId: existing._id,
            room: { id: roomId, name: roomName },
            userId: user.user_id,
          });
        } else {
          await startAndJoinCall({ roomId, roomName, userId: user.user_id });
        }
      } catch {
        hasAttempted.current = false;
      }
    })();
  }, [
    isLoading,
    isThisRoomJoined,
    isInDifferentCall,
    user,
    activeCalls,
    roomId,
    roomName,
    joinExistingSession,
    startAndJoinCall,
  ]);

  useEffect(() => {
    return () => {
      const current = useCallStore.getState();
      if (current.actualRoomId === roomId && current.callId) {
        leaveCurrentSession(current.callId).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return { isThisRoomJoined, isInDifferentCall };
}

function PublicCallPanelBody({
  roomId,
  roomName,
  playerCount,
  className,
}: {
  roomId: string;
  roomName: string;
  playerCount: number;
  className?: string;
}) {
  const { isThisRoomJoined, isInDifferentCall } = useAutoJoinPublicVoice(
    roomId,
    roomName,
  );

  return (
    <div
      className={`bg-theme-surface flex flex-col overflow-hidden border-theme-border ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 h-14 border-b border-theme-border shrink-0">
        <span className="text-xs font-semibold tracking-wide text-white">
          {roomName}
        </span>
        <span className="flex items-center gap-1.5 text-[10px] font-normal text-gray-500 tracking-wide whitespace-nowrap">
          <HugeiconsIcon icon={UserGroupIcon} className="w-3.5 h-3.5" />
          {playerCount} {playerCount === 1 ? "PLAYER" : "PLAYERS"}
        </span>
      </div>

      {isThisRoomJoined ? (
        <div className="relative flex-1 min-h-0 flex flex-col bg-theme-base overflow-hidden">
          <CallOverlayHeader />
          <ParticipantGrid />
          <CallControls />
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex items-center justify-center gap-2 text-xs text-gray-400 p-4 text-center">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
          {isInDifferentCall
            ? "Voice unavailable — you're in another call"
            : "Connecting voice..."}
        </div>
      )}
    </div>
  );
}

export function PublicCallPanel({
  roomId,
  roomName = "Anomaly Lobby",
  playerCount,
  className,
}: {
  roomId: string;
  roomName?: string;
  playerCount: number;
  className?: string;
}) {
  return (
    <RoomCallProvider roomId={roomId}>
      <PublicCallPanelBody
        roomId={roomId}
        roomName={roomName}
        playerCount={playerCount}
        className={className}
      />
    </RoomCallProvider>
  );
}
