"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUIStore } from "@/store/uiStore";
import { useCallStore } from "@/store/callStore";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, GameController01Icon, StopIcon } from "@hugeicons/core-free-icons";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "sonner";
import { RoundView } from "./RoundView";
import { useGameSessionPresence } from "@/hooks/useGameSessionPresence";

/**
 * C2 — game overlay/panel shell. C3 — now hosts real round content.
 * C7 — end-session wiring (this update).
 *
 * Mounts inside the call overlay's participant-grid area (see CallOverlay.tsx),
 * on top of the call UI but never covering the header or control bar — both
 * stay reachable so the underlying call/chat is untouched while Signal is
 * open, per the Feature 1 requirement in the PRD.
 *
 * C2's static "Signal is warming up" placeholder is gone — the body is now
 * <RoundView>, which reads B5's getRoundView and handles its own
 * loading/pre-round/in-round states (see RoundView.tsx for the breakdown).
 *
 * Closing the panel (X button) only hides it — it does NOT end the Signal
 * session. signalSessionId in uiStore is left untouched, so re-clicking
 * "Play Signal" on the call bar reopens this same panel without relaunching
 * anything.
 *
 * "End Signal" (new, C7) is the genuine end-session action, wired to
 * gameSessions.endSession — behind a ConfirmDialog since it's irreversible
 * and affects every player in the session, not just this client (same
 * "irreversible, confirm first" treatment LeaveDialog.tsx already gives
 * leaving/deleting a room). On success, this client's own
 * signalSessionId/isSignalPanelOpen are cleared immediately so the call
 * bar's "Play Signal" button reverts and a later click starts a fresh
 * session rather than reopening the now-ended one.
 *
 * Also subscribes to the session's own status (getSessionById) so that if
 * *another* client ends the session (or it's ended by any means), this
 * client's local state quietly resets too — panel closes, session id
 * clears — without that client having clicked anything itself. Reads only;
 * ending the session for real always goes through the endSession mutation
 * above, never through this effect.
 *
 * G2: signalSessionId is a single global value in uiStore, not scoped per
 * room — nothing about it says "this session belongs to room A." Before
 * this fix, leaving room A's call (while its Signal session was still
 * `"waiting"`/`"in_progress"`, i.e. never explicitly ended) and then
 * joining room B's call left `signalSessionId` pointing at room A's old
 * session. CallControls.tsx's own "Play Signal" button only checks
 * `if (signalSessionId)` before deciding to reopen rather than create —
 * it has no way to know that id belongs to a different room — so clicking
 * it in room B's call silently reopened room A's game (and would have
 * posted room A's own system messages into room A's chat while the player
 * watched from room B's call). The reset effect below now also fires when
 * the held session's own `room_id` no longer matches the actively-joined
 * call's `actualRoomId`, treating a room mismatch the same as "ended" —
 * `CallControls`/`SignalPanel` mount and unmount together inside
 * `CallOverlay` (gated on the same `isActive && isOnCorrectPage`), so this
 * effect gets a fresh chance to run (or re-runs off its own
 * `actualRoomId` dependency, if the two components stay mounted through
 * an in-place room switch) before a stale reopen is reachable.
 *
 * Ending only ever touches this session's own `gameSessions` row plus one
 * system message (see gameSessions.ts's endSession for the backend side of
 * that guarantee) — the room's underlying call and chat are untouched, and
 * this component doesn't reach into either.
 */
export const SignalPanel = () => {
  const isOpen = useUIStore((state) => state.isSignalPanelOpen);
  const sessionId = useUIStore((state) => state.signalSessionId);
  const setSignalPanelOpen = useUIStore((state) => state.setSignalPanelOpen);
  const setSignalSessionId = useUIStore((state) => state.setSignalSessionId);
  const actualRoomId = useCallStore((state) => state.actualRoomId);

  const session = useQuery(
    api.gameSessions.getSessionById,
    sessionId ? { session_id: sessionId } : "skip",
  );
  const endSession = useMutation(api.gameSessions.endSession);
  const [isEnding, setIsEnding] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // F1a: heartbeats for as long as a session id is held, regardless of
  // `isOpen` — same "runs unconditionally, only render output is gated"
  // reasoning the cleanup effect above already uses. A player who's seated
  // in an in-room session but has the panel closed (C2's dismiss-only X)
  // is still meant to read as connected while their client is around.
  useGameSessionPresence(sessionId);

  // Passive cleanup: this session has ended (by this client's own action
  // below, by another client's, or any other path), OR it belongs to a
  // room the player is no longer actively in (G2, see header) — reset
  // local state so the call bar's button reverts to "Play Signal" instead
  // of reopening a dead or wrong-room session. `session === null` (query
  // resolved, row genuinely gone) is treated the same as `status ===
  // "ended"`; `undefined` (still loading) is left alone.
  useEffect(() => {
    if (session === undefined) return;
    if (session === null || session.status === "ended") {
      setSignalPanelOpen(false);
      setSignalSessionId(null);
      return;
    }
    if (actualRoomId && session.room_id !== actualRoomId) {
      setSignalPanelOpen(false);
      setSignalSessionId(null);
    }
  }, [session, actualRoomId, setSignalPanelOpen, setSignalSessionId]);

  const handleEndSignal = async () => {
    if (!sessionId || isEnding) return;
    setIsEnding(true);
    try {
      const result = await endSession({ session_id: sessionId });
      if (!result || "error" in result) {
        toast.error((result && "error" in result && result.error) || "Couldn't end Signal");
        return;
      }
      setSignalPanelOpen(false);
      setSignalSessionId(null);
      if (!result.alreadyEnded) toast.success("Signal ended");
    } catch {
      toast.error("Couldn't end Signal");
    } finally {
      setIsEnding(false);
    }
  };

  if (!isOpen || !sessionId) return null;

  return (
    <div className="absolute inset-0 flex items-center justify-center p-4 pt-16 pb-24 md:pt-16 md:pb-24 bg-theme-base/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl overflow-hidden flex flex-col max-h-full shadow-xl">
        <div className="flex items-center justify-between px-4 h-12 border-b border-theme-border shrink-0">
          <div className="flex items-center gap-2 text-gray-200">
            <HugeiconsIcon icon={GameController01Icon} className="w-4 h-4" />
            <span className="text-sm font-medium">Signal</span>
          </div>
          <div className="flex items-center gap-1">
            <TooltipWrapper content="End Signal for everyone">
              <button
                onClick={() => setIsConfirmOpen(true)}
                disabled={isEnding}
                className="w-8 h-8 flex items-center justify-center hover:bg-theme-hover cursor-pointer duration-100 transition-all ease-in-out rounded-lg text-gray-400 disabled:opacity-50"
              >
                <HugeiconsIcon icon={StopIcon} className="w-4 h-4" />
              </button>
            </TooltipWrapper>
            <TooltipWrapper content="Close">
              <button
                onClick={() => setSignalPanelOpen(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-theme-hover cursor-pointer duration-100 transition-all ease-in-out rounded-lg text-gray-400"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
              </button>
            </TooltipWrapper>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col items-center justify-center">
          <RoundView sessionId={sessionId} />
        </div>
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="End Signal for everyone?"
        description="This ends the game for the whole room. The call and chat aren't affected."
        confirmText="End Signal"
        variant="destructive"
        onConfirm={handleEndSignal}
      />
    </div>
  );
};
