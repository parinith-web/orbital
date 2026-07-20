"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/dialog";
import { TooltipWrapper } from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { GameController01Icon, StopIcon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { RoundView } from "./RoundView";
import { Leaderboard } from "./Leaderboard";
import { useGameSessionPresence } from "@/hooks/useGameSessionPresence";
import { useCurrentUser } from "@/hooks";

/**
 * H7.1 — game-first, call-independent replacement for the *content* that
 * used to live only inside `SignalPanel.tsx`'s centered modal.
 *
 * WHY THIS EXISTS: pre-H7, Signal only ever rendered nested inside
 * `CallOverlay`, which itself only mounts once a player has joined the
 * room's voice/video call (`CallOverlay.tsx`'s `isActive` gate) — see
 * `SignalPanel.tsx`'s header comment for the full shape of that coupling.
 * That's backwards for a game-first room: per H5, a room created via
 * `createGameRoom`/joined via `joinGameRoomByCode` already has a live
 * `gameSessions` row the moment the room exists, with no call involved at
 * all. A player should see the game the instant they're in the room, call
 * joined or not.
 *
 * This component resolves its session the same way — but *only* off
 * `gameSessions.getSessionByRoomId(room_id)`, never off `uiStore`'s
 * `signalSessionId`/`isSignalPanelOpen` (those remain SignalPanel's own
 * call-bar-triggered state for as long as that component still exists —
 * see its file for why H7.1 deliberately leaves it alone). Two independent
 * callers reading the same backend row is exactly the shape
 * `getSessionByRoomId`'s own doc comment describes ("the room's current
 * live session, if any") — nothing about that query is call-scoped.
 *
 * NOT YET WIRED IN: H7.2 is where this actually replaces the room page's
 * center-stage content and sits alongside a permanently-docked chat/call
 * side panel. This session only builds and self-verifies the component
 * (tsc/eslint/vitest — see the plan's H7.1 notes for why there's no
 * frontend harness to click through with, same gap H6.1/H6.2/H6.3 already
 * flagged), matching how H6.1 built its modals against a temporary trigger
 * before H6.2 gave them a permanent home.
 *
 * NO-SESSION STATE: kept, not dropped, even though every room reachable
 * through H5/H6's Create Room / Join Room flow already has one from the
 * moment it's created. A defensive "Start Signal" fallback (reusing the
 * pre-existing `createSession` mutation `CallControls.tsx` already calls)
 * covers any room that predates H5 or otherwise has no session row yet,
 * rather than this component assuming a session always exists and having
 * nothing to render if that assumption is ever wrong.
 */
export const GameStage = ({ room_id }: { room_id: string }) => {
  const { user: currentUser } = useCurrentUser();

  const session = useQuery(api.gameSessions.getSessionByRoomId, { room_id });
  const createSignalSession = useMutation(api.gameSessions.createSession);
  const endSession = useMutation(api.gameSessions.endSession);

  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Same "heartbeat for as long as a session id is held" reasoning
  // SignalPanel.tsx's F1a comment already lays out — a player who's on the
  // game-room page reads as "around" regardless of whether the game body
  // below is mid-round or showing the ended leaderboard.
  useGameSessionPresence(session?.session_id ?? null);

  const handleStartSignal = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const result = await createSignalSession({ room_id });
      if (!result || "error" in result) {
        toast.error(
          (result && "error" in result && result.error) ||
            "Couldn't start Signal",
        );
        return;
      }
      if (result.alreadyExists) toast.success("Rejoined Signal session");
    } catch {
      toast.error("Couldn't start Signal");
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndSignal = async () => {
    if (!session || isEnding) return;
    setIsEnding(true);
    try {
      const result = await endSession({ session_id: session.session_id });
      if (!result || "error" in result) {
        toast.error(
          (result && "error" in result && result.error) ||
            "Couldn't end Signal",
        );
        return;
      }
      setIsConfirmOpen(false);
      if (!result.alreadyEnded) toast.success("Signal ended");
    } catch {
      toast.error("Couldn't end Signal");
    } finally {
      setIsEnding(false);
    }
  };

  // undefined = still loading; render nothing rather than flash the
  // no-session fallback for a session that's actually just en route.
  if (session === undefined) return null;

  if (session === null) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex items-center gap-2 text-gray-300">
          <HugeiconsIcon icon={GameController01Icon} className="w-5 h-5" />
          <span className="text-sm font-medium">Signal</span>
        </div>
        <p className="text-sm text-gray-400 max-w-xs">
          No game running in this room yet.
        </p>
        <Button
          variant="primary"
          onClick={handleStartSignal}
          disabled={isStarting}
        >
          Start Signal
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 h-12 border-b border-theme-border shrink-0">
        <div className="flex items-center gap-2 text-gray-200">
          <HugeiconsIcon icon={GameController01Icon} className="w-4 h-4" />
          <span className="text-sm font-medium">Signal</span>
        </div>
        {session.status !== "ended" && (
          <TooltipWrapper content="End Signal for everyone">
            <button
              onClick={() => setIsConfirmOpen(true)}
              disabled={isEnding}
              className="w-8 h-8 flex items-center justify-center hover:bg-theme-hover cursor-pointer duration-100 transition-all ease-in-out rounded-lg text-gray-400 disabled:opacity-50"
            >
              <HugeiconsIcon icon={StopIcon} className="w-4 h-4" />
            </button>
          </TooltipWrapper>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col items-center justify-center">
        {session.status === "ended" ? (
          <Leaderboard
            sessionId={session.session_id}
            currentUserId={currentUser?.user_id}
          />
        ) : (
          <RoundView sessionId={session.session_id} />
        )}
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
