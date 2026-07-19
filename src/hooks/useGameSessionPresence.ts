import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getTabConnectionId } from "@/lib/games/connectionId";

// Must match convex/gamePresence.ts's HEARTBEAT_INTERVAL_MS. Not imported
// directly — that file pulls in `mutation`/`internalMutation` from Convex's
// generated server code, which isn't meant for a client bundle (same
// reasoning `lobbyConfig.ts` was split out from `gameRounds.ts` for
// `AUTOSTART_COUNTDOWN_MS` back in E2). Kept as a plain re-stated constant
// instead of a shared pure-values file, since this is the only client-side
// consumer of it so far.
const HEARTBEAT_INTERVAL_MS = 10 * 1000;

/**
 * F1a — keeps a player's `gamePlayers.connected` flag alive while they have
 * Signal's game UI mounted, and signals an instant disconnect when they
 * close the tab/navigate away. Mirrors `useGlobalPresence.ts`'s two-layer
 * shape (instant `beforeunload`/`pagehide` call + interval fallback) at a
 * much tighter cadence — see `gamePresence.ts`'s file header for why this
 * needs its own timescale instead of reusing global presence.
 *
 * WHERE TO MOUNT THIS: call it from whichever component owns the session
 * id for as long as a player is meant to read as "around," not necessarily
 * only while game content is on screen — the two current call sites
 * deliberately differ, worth stating explicitly rather than assuming one
 * rule fits both:
 *   - `SignalPanel.tsx` (Feature 1, in-room) calls this unconditionally
 *     once `signalSessionId` is held, regardless of the panel's own
 *     open/closed state — closing the panel (C2's dismiss-only X button)
 *     is a UI dismissal, not leaving the game, so heartbeating continues.
 *   - `PublicLobbyScreen.tsx` (Feature 2) only renders (and therefore only
 *     heartbeats) while the player is actually on `/portal/signal` —
 *     navigating away without calling `leaveSession` unmounts this hook
 *     (see the F2b update below for what that now does), since there's no
 *     equivalent "keep it open in the background" surface for the public
 *     lobby the way there is for an in-room panel.
 * Whether a disconnected player's mid-round turn/vote should behave
 * differently depending on *why* they went stale is exactly the kind of
 * question F1c/F1d need to answer, not this file — flagging the current
 * per-site behavior here so that decision starts from what's actually
 * true today, not an assumption.
 *
 * F2b UPDATE: cleanup now also fires `goOfflineMutation` unconditionally,
 * not just from the `beforeunload`/`pagehide` listeners. Those two only
 * catch a real tab close/hard refresh — they never fire for an in-app SPA
 * navigation away (e.g. clicking "Friends" in the sidebar while on
 * `/portal/signal`, or leaving a room's call view while Signal was open),
 * which just unmounts this hook's effect with no browser unload event at
 * all. Before this, that case was the literal gap this file's own header
 * and `PublicLobbyEntry`/`PublicLobbyScreen`'s doc comments flagged as "not
 * handled": the player's `connected` flag stayed `true` — heartbeats just
 * silently stopped — until F1a's staleness sweep eventually caught up
 * (`STALE_THRESHOLD_MS` later), during which they'd sit in the roster
 * looking present, still count toward capacity, and (for the public lobby)
 * keep a room from ever reading as empty enough for D3's recycle path.
 * Calling `goOfflineMutation` from the cleanup itself closes that gap the
 * same way `beforeunload`/`pagehide` already do for a hard close — instant
 * disconnect instead of a stale-timeout-shaped delay — for both this
 * hook's call sites (SignalPanel unmounts when the call/room view itself
 * is left, not on the panel's own dismiss-only close; PublicLobbyScreen
 * unmounts on navigating off `/portal/signal`). Safe to call on every
 * unmount, including a benign remount (e.g. React StrictMode's dev-mode
 * double-invoke): `goOffline`'s own `active_connection_id` check
 * (`gamePresence.ts`) already no-ops a disconnect signal that's been
 * superseded by a fresher connection, and the tab-scoped `connectionId`
 * here is stable across remounts within the same tab, so at worst this
 * produces a same-tab disconnect-then-immediate-reconnect, never a false
 * "someone else took over" skip. Deliberately NOT a `leaveSession` call —
 * this only affects presence (`connected`), not the seat itself; the
 * player stays in `gamePlayers` and can resume normally (F1b's reconnect
 * path / F2a's cross-session dedup) if they come back. Actually vacating
 * the seat still requires the explicit "Leave"/"End Signal" actions this
 * file's callers already have — that part of the original gap is
 * unchanged, and intentionally so (see this hook's own header above for
 * why "around but disconnected" and "gone for good" are different states).
 *
 * No-ops entirely if `sessionId` is null/undefined, so callers can pass a
 * possibly-not-yet-loaded session id without a separate mount guard.
 */
export function useGameSessionPresence(sessionId: string | null | undefined) {
  const heartbeatMutation = useMutation(api.gamePresence.heartbeat);
  const goOfflineMutation = useMutation(api.gamePresence.goOffline);

  useEffect(() => {
    if (!sessionId) return;

    // F1b: same tab-scoped id on every call this hook makes for this
    // session, so the server can tell "this tab's own routine heartbeat"
    // apart from "a different, newer tab has taken over" — see
    // connectionId.ts and gamePresence.ts's headers for the full reasoning.
    const connectionId = getTabConnectionId();

    // Fire one immediately on mount rather than waiting a full interval —
    // same "don't sit stale for the first tick" reasoning
    // useGlobalPresence.ts's initializePresence() uses for setStatus("online").
    heartbeatMutation({ session_id: sessionId, connection_id: connectionId });

    const hbInterval = setInterval(() => {
      heartbeatMutation({ session_id: sessionId, connection_id: connectionId });
    }, HEARTBEAT_INTERVAL_MS);

    const onBeforeUnload = () => {
      goOfflineMutation({ session_id: sessionId, connection_id: connectionId });
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onBeforeUnload);

    return () => {
      clearInterval(hbInterval);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onBeforeUnload);
      // F2b: the SPA-navigation-away case `beforeunload`/`pagehide` can't
      // see — see this file's F2b doc comment above for the full reasoning.
      goOfflineMutation({ session_id: sessionId, connection_id: connectionId });
    };
  }, [sessionId, heartbeatMutation, goOfflineMutation]);
}
