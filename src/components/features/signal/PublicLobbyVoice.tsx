"use client";

import { useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mic02Icon, MicOff02Icon } from "@hugeicons/core-free-icons";
import { useCalls, useCallSessionActions } from "@/hooks";
import { useCallStore } from "@/store/callStore";
import { useUserStore } from "@/store/useUserStore";

/**
 * E3 — auto-triggers a PeerJS group call for a newly formed public Signal
 * room, per the PRD's own framing (§7): "the same PeerJS group-call flow
 * spun up for a newly formed public room, initialized the same way an ad
 * hoc group call is today, just auto-triggered on room fill rather than
 * manually started by a user."
 *
 * "Initialized the same way" is taken literally: this does NOT reimplement
 * any PeerJS wiring. It calls the exact same `useCallSessionActions`
 * actions a room's own call UI uses —
 *   - `startAndJoinCall` (SidebarCalls.tsx's "Start New Call" button), and
 *   - `joinExistingSession` (ActiveCallPanel.tsx's "Join" button on an
 *     already-active call) —
 * against the public session's synthetic `room_id` (see
 * `publicMatchmaking.ts`'s `generateSessionId("public_room")`). Whichever
 * player's client sees no active call yet for that room_id starts one;
 * everyone else joins the one that's already there — same "first player in
 * starts it, rest join it" shape a real room already has, just triggered
 * by mounting instead of a click.
 *
 * SCOPE: this is voice only — a compact status/mute bar, not a full call
 * UI. Video, screen-share, and device settings are Feature 1's in-room
 * `CallOverlay`/`CallControls`, which this deliberately does NOT reuse:
 * that component also renders the "Play Signal" button (which would try to
 * start a second, private-mode Signal session keyed to this synthetic
 * `room_id`, wrong for a session already public and already playing) and
 * `SignalPanel`'s own round UI (which `PublicLobbyScreen` already renders
 * directly via `RoundView`, so mounting `CallOverlay` here would double up
 * the round UI). A minimal purpose-built bar avoids both collisions.
 *
 * KNOWN GAP, left honestly out of scope (flagged for Phase F, same
 * "flag it, don't silently ignore it" convention every prior session in
 * this file's neighbors used): if several players are seated into a brand
 * new public room within the same instant (matchmaking racing multiple
 * first-joiners), more than one of their clients could each see zero
 * active calls for the room and each call `startAndJoinCall`, creating two
 * `calls` rows for the same `room_id` instead of one. `calls.ts` has no
 * atomic "start-or-join" mutation the way `gameSessions.seatPlayerInSession`
 * does for seating — that's a real, pre-existing gap in `calls.ts` itself,
 * not something introduced here, but auto-triggering (vs. a human clicking)
 * makes the near-simultaneous case meaningfully more likely to actually
 * happen. Worth a dedicated look (either an atomic mutation, or a small
 * client-side jittered delay before the "start" branch) before this is
 * considered hardened.
 */
export function PublicLobbyVoice({
  roomId,
  roomName,
}: {
  roomId: string;
  roomName: string;
}) {
  const user = useUserStore((s) => s.user);
  const { activeCalls, isLoading } = useCalls(roomId);
  const { startAndJoinCall, joinExistingSession, leaveCurrentSession } =
    useCallSessionActions();
  const status = useCallStore((s) => s.status);
  const actualRoomId = useCallStore((s) => s.actualRoomId);
  const isMuted = useCallStore((s) => s.isMuted);
  const toggleMute = useCallStore((s) => s.toggleMute);

  const hasAttempted = useRef(false);
  const isThisRoomJoined =
    actualRoomId === roomId && (status === "joined" || status === "joining");
  const isInDifferentCall =
    !!actualRoomId &&
    actualRoomId !== roomId &&
    (status === "joined" || status === "joining");

  useEffect(() => {
    if (isLoading || hasAttempted.current || isThisRoomJoined || !user) return;
    // Auto-triggering only ever fills in "no call yet for this lobby" — it
    // never force-switches a player out of a call they're already in
    // (e.g. reached this page some other way while mid-call elsewhere).
    // That's `joinOrSwitchSession`'s job (with its own confirmation modal),
    // not something to do silently on mount.
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
        // Best-effort: voice is additive to the round game, not a
        // precondition for it. `useCallStore`'s own `error` field already
        // surfaces the failure to anything reading it; allow a retry on
        // the next render (e.g. `activeCalls` changing) rather than
        // permanently giving up.
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

  // Leave the call when this bar unmounts — the player left the lobby (or
  // the whole page did), so voice should go with it. Reads store state
  // fresh at unmount time rather than closing over a stale value.
  useEffect(() => {
    return () => {
      const current = useCallStore.getState();
      if (current.actualRoomId === roomId && current.callId) {
        leaveCurrentSession(current.callId).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  if (!isThisRoomJoined) {
    return (
      <div className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 bg-theme-hover rounded-xl px-3 py-2">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
        {isInDifferentCall ? "Voice unavailable — you're in another call" : "Connecting voice..."}
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-between gap-2 text-xs text-gray-200 bg-theme-hover rounded-xl px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
        Voice connected
      </div>
      <button
        onClick={() => toggleMute()}
        className="w-6 h-6 flex items-center justify-center rounded-full bg-theme-base hover:bg-theme-border transition-colors"
        title={isMuted ? "Unmute" : "Mute"}
      >
        <HugeiconsIcon
          icon={isMuted ? MicOff02Icon : Mic02Icon}
          className="w-3.5 h-3.5"
        />
      </button>
    </div>
  );
}
