"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { GameController01Icon } from "@hugeicons/core-free-icons";
import { ROUTES } from "@/lib/constants/routes";
import { getTabConnectionId } from "@/lib/games/connectionId";
import { PublicLobbyScreen } from "./PublicLobbyScreen";

/**
 * E1 — "Join a Game" entry point + "finding a game..." transient state,
 * calling D1/D2/D3's `findOrCreatePublicSession`.
 *
 * E2 UPDATE: the "matched" state below now renders the real
 * `PublicLobbyScreen` (realtime joiners list, 4-player/15s countdown, and
 * the hand-off into `RoundView` once a round actually starts) instead of
 * E1's placeholder live-player-count card. This file's own job stays the
 * same as E1 left it: run matchmaking once on mount, hold the resulting
 * `session_id`, and offer a way back out on error. NOT built here: E3's
 * auto-triggered call, E4's post-game screen — see `PublicLobbyScreen`'s
 * own doc comment for what's still deliberately out of scope.
 *
 * SINGLE-CLICK FLOW: the PRD's Flow B is "Portal home -> 'Join a Game' ->
 * matchmaking places user" — one click, not click-then-click-again. The
 * click already happened in the sidebar (navigating here); this component
 * fires the matchmaking mutation itself on mount rather than waiting for a
 * second click on this page. Guarded with a ref (not just a state flag)
 * against React StrictMode's dev-mode double-invoke of effects, since
 * `findOrCreatePublicSession` is NOT idempotent the way `createSession`
 * is — calling it twice would seat the same user into the matchmaking
 * flow twice in a row (in practice landing them in the same session via
 * the reconnect path `seatPlayerInSession` already handles, but there's no
 * reason to round-trip the mutation twice for a StrictMode artifact).
 *
 * NOT HANDLED HERE (left for later, per the same "flag it, don't silently
 * ignore it" convention this file's neighbors use):
 * - [F2b landed] The player no longer sits around looking "connected" —
 *   navigating away from this page now instantly flips `connected: false`
 *   (via `useGameSessionPresence`'s cleanup, called from `PublicLobbyScreen`
 *   below), instead of waiting on the staleness sweep. What's still true:
 *   navigating away does NOT call `leaveSession` — the player keeps their
 *   *seat* (still in `gamePlayers`, still counts toward capacity) with no
 *   UI showing it, they just correctly read as disconnected rather than
 *   falsely connected in the meantime. Revisiting this page reconnects
 *   into the same session either way (F1b's reconnect path, and since F2a,
 *   regardless of whether that session has moved past `"waiting"`), so
 *   this remains "not unrecoverable, just not fully cleaned up" — an
 *   actual auto-leave-on-navigate-away policy decision is still open, not
 *   assumed here.
 * - No silent-retry loop client-side: D2c already proved a single
 *   `findOrCreatePublicSession` call can't overshoot capacity even under
 *   concurrent joins, so the PRD's "matchmaking silently retries" (Flow C)
 *   is already satisfied server-side, in one round trip — there's nothing
 *   for the client to retry.
 */

type MatchState =
  | { status: "matching" }
  | { status: "matched"; session_id: string }
  | { status: "error"; message: string };

export const PublicLobbyEntry = () => {
  const router = useRouter();
  const findOrCreatePublicSession = useMutation(api.publicMatchmaking.findOrCreatePublicSession);
  const leaveSession = useMutation(api.gameSessions.leaveSession);
  const [state, setState] = useState<MatchState>({ status: "matching" });
  const [isLeaving, setIsLeaving] = useState(false);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    (async () => {
      try {
        // F1b: same tab-scoped id `useGameSessionPresence` will use for
        // this session's later heartbeats — lets a reconnect through this
        // entry point (revisiting the lobby page) participate in the
        // stale-goOffline guard the same way a heartbeat-driven reconnect
        // already does. See connectionId.ts's header.
        const result = await findOrCreatePublicSession({ connection_id: getTabConnectionId() });
        if (!result || "error" in result) {
          setState({
            status: "error",
            message: (result && "error" in result && result.error) || "Couldn't find a game",
          });
          return;
        }
        setState({ status: "matched", session_id: result.session_id });
      } catch {
        setState({ status: "error", message: "Couldn't find a game" });
      }
    })();
  }, [findOrCreatePublicSession]);

  const handleRetry = () => {
    hasStarted.current = false;
    setState({ status: "matching" });
  };

  const handleLeave = async () => {
    if (state.status !== "matched" || isLeaving) return;
    setIsLeaving(true);
    try {
      await leaveSession({ session_id: state.session_id });
    } catch {
      // Leaving is best-effort here — either way, send the player back.
    } finally {
      setIsLeaving(false);
      router.push(ROUTES.PORTAL);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl p-8 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-theme-hover flex items-center justify-center">
          <HugeiconsIcon icon={GameController01Icon} className="w-6 h-6 text-white" />
        </div>

        {state.status === "matching" && (
          <>
            <h1 className="text-lg font-medium text-white">Finding a game...</h1>
            <p className="text-sm text-gray-400">
              Hang tight, we&apos;re placing you into an Anomaly lobby.
            </p>
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mt-2" />
          </>
        )}

        {state.status === "error" && (
          <>
            <h1 className="text-lg font-medium text-white">Couldn&apos;t find a game</h1>
            <p className="text-sm text-gray-400">{state.message}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="secondary" onClick={() => router.push(ROUTES.PORTAL)}>
                Back to Portal
              </Button>
              <Button variant="primary" onClick={handleRetry}>
                Try Again
              </Button>
            </div>
          </>
        )}

        {state.status === "matched" && (
          <PublicLobbyScreen
            sessionId={state.session_id}
            onLeave={handleLeave}
            isLeaving={isLeaving}
          />
        )}
      </div>
    </div>
  );
};
