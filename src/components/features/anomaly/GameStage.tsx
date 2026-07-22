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
 * WHY THIS EXISTS: pre-H7, Anomaly only ever rendered nested inside
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
 * NO-SESSION STATE: kept, not dropped, even though every room reachable
 * through H5/H6's Create Room / Join Room flow already has one from the
 * moment it's created. A defensive "Start Anomaly" fallback (reusing the
 * pre-existing `createSession` mutation `CallControls.tsx` used to call,
 * before H7.2 retired that button) covers any room that predates H5 or
 * otherwise has no session row yet, rather than this component assuming a
 * session always exists and having nothing to render if that assumption
 * is ever wrong.
 *
 * H8 — HOST-GATED CONTROLS: "End Anomaly" and (once the session has ended)
 * "Rematch" only render for a user `canActAsHost` (derived below,
 * mirroring `gameSessions.ts`'s own server-side `canActAsHost` helper) —
 * no host at all, the host themselves, or a disconnected host's stand-in.
 * This is a UX gate only, not the real authorization: `endSession`/
 * `rematchSession` re-check on the backend regardless of what this
 * component renders, so a stale client (someone who was host a moment
 * ago, now isn't) gets a clean error toast from the mutation itself
 * rather than a false sense of access from a button that shouldn't have
 * been there. See `gameSessions.ts`'s `canActAsHost` for the full
 * authorization rationale, including the host-disconnect-mid-game
 * fallback this mirrors.
 */
export const GameStage = ({ room_id }: { room_id: string }) => {
  const { user: currentUser } = useCurrentUser();

  const session = useQuery(api.gameSessions.getSessionByRoomId, { room_id });
  const players = useQuery(
    api.gameSessions.getSessionPlayers,
    session ? { session_id: session.session_id } : "skip",
  );
  const createAnomalySession = useMutation(api.gameSessions.createSession);
  const endSession = useMutation(api.gameSessions.endSession);
  const rematchSession = useMutation(api.gameSessions.rematchSession);

  const [isStarting, setIsStarting] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [isRematching, setIsRematching] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // H8 — same rule gameSessions.ts's canActAsHost applies server-side: no
  // host set (nothing to gate on), the current user IS the host, or the
  // host's own gamePlayers row is missing/disconnected (the
  // host-disconnect-mid-game fallback). `players` is undefined while
  // still loading — canActAsHost defaults to false in that split second
  // rather than flashing the controls on and then potentially off again
  // once the real roster arrives.
  const hostPlayer = players?.find((p) => p.user_id === session?.host_user_id);
  const canActAsHost =
    !!session &&
    players !== undefined &&
    (!session.host_user_id ||
      session.host_user_id === currentUser?.user_id ||
      !hostPlayer?.connected);

  // Same "heartbeat for as long as a session id is held" reasoning
  // SignalPanel.tsx's F1a comment already lays out — a player who's on the
  // game-room page reads as "around" regardless of whether the game body
  // below is mid-round or showing the ended leaderboard.
  useGameSessionPresence(session?.session_id ?? null);

  const handleStartAnomaly = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const result = await createAnomalySession({ room_id });
      if (!result || "error" in result) {
        toast.error(
          (result && "error" in result && result.error) ||
            "Couldn't start Anomaly",
        );
        return;
      }
      if (result.alreadyExists) toast.success("Rejoined Anomaly session");
    } catch {
      toast.error("Couldn't start Anomaly");
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndAnomaly = async () => {
    if (!session || isEnding) return;
    setIsEnding(true);
    try {
      const result = await endSession({ session_id: session.session_id });
      if (!result || "error" in result) {
        toast.error(
          (result && "error" in result && result.error) ||
            "Couldn't end Anomaly",
        );
        return;
      }
      setIsConfirmOpen(false);
      if (!result.alreadyEnded) toast.success("Anomaly ended");
    } catch {
      toast.error("Couldn't end Anomaly");
    } finally {
      setIsEnding(false);
    }
  };

  const handleRematch = async () => {
    if (!session || isRematching) return;
    setIsRematching(true);
    try {
      const result = await rematchSession({ session_id: session.session_id });
      if (!result || "error" in result) {
        toast.error(
          (result && "error" in result && result.error) ||
            "Couldn't start a rematch",
        );
        return;
      }
      // No navigation/state update needed here — getSessionByRoomId above
      // is already subscribed to this room_id and picks up the fresh
      // session the instant it's inserted (see rematchSession's own doc
      // comment for why this "rides on existing Convex realtime
      // subscriptions", same as endSession's leaderboard broadcast).
      if (!result.alreadyExists) toast.success("Rematch started!");
    } catch {
      toast.error("Couldn't start a rematch");
    } finally {
      setIsRematching(false);
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
          <span className="text-sm font-medium">Anomaly</span>
        </div>
        <p className="text-sm text-gray-400 max-w-xs">
          No game running in this room yet.
        </p>
        <Button
          variant="primary"
          onClick={handleStartAnomaly}
          disabled={isStarting}
        >
          Start Anomaly
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <div className="flex items-center justify-between px-4 h-12 border-b border-theme-border shrink-0">
        <div className="flex items-center gap-2 text-gray-200">
          <HugeiconsIcon icon={GameController01Icon} className="w-4 h-4" />
          <span className="text-sm font-medium">Anomaly</span>
        </div>
        {session.status !== "ended" && canActAsHost && (
          <TooltipWrapper content="End Anomaly for everyone">
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
            actions={
              canActAsHost ? (
                <Button
                  variant="primary"
                  onClick={handleRematch}
                  disabled={isRematching}
                  className="flex items-center gap-2"
                >
                  <HugeiconsIcon icon={GameController01Icon} className="w-4 h-4" />
                  Rematch
                </Button>
              ) : undefined
            }
          />
        ) : (
          <RoundView sessionId={session.session_id} />
        )}
      </div>

      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        title="End Anomaly for everyone?"
        description="This ends the game for the whole room. The call and chat aren't affected."
        confirmText="End Anomaly"
        variant="destructive"
        onConfirm={handleEndAnomaly}
      />
    </div>
  );
};
