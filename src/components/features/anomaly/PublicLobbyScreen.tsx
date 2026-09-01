"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AUTOSTART_COUNTDOWN_MS } from "@/convex/games/lobbyConfig";
import { UserAvatar } from "@/components/avatar";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { useCurrentUser } from "@/hooks";
import { Button } from "@/components/ui";
import { ProgressCircle } from "@/components/ui/ProgressCircle";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";
import { RoundView } from "./RoundView";
import { PublicCallPanel } from "./PublicCallPanel";
import { PostGameActions } from "./PostGameActions";
import { Leaderboard } from "./Leaderboard";
import { useGameSessionPresence } from "@/hooks/useGameSessionPresence";
import { useUIStore } from "@/store/uiStore";
import { ChatPanel } from "@/components/features/rooms/ChatPanel";
import { BubbleChatIcon } from "@hugeicons/core-free-icons";

/**
 * E2 — public lobby screen: realtime joiners list + the 4-player/15s
 * countdown default, replacing E1's `PublicLobbyEntry` "matched" placeholder
 * (a live player count and nothing else).
 *
 * BACKEND NOTE (see gameRounds.ts's own "AUTOSTART COUNTDOWN (E2)" doc
 * comment for the full story): before this session, `min_players_to_start`/
 * `countdown_started_at` existed on the schema (A1) and D1 stamped the
 * former on every public session, but nothing ever actually started a
 * countdown or acted on one elapsing — orbital_1.md's "4 players triggers a
 * 15s countdown" default was entirely unimplemented server-side. This
 * component's countdown ring is only meaningful now that that backend piece
 * (`maybeStartAutostartCountdown` / `autoStartRound`) exists.
 *
 * TWO-STATE SWITCH, driven by whether a round exists yet:
 * - No round (`getRoundView` returns `null`) -> render the lobby itself:
 *   roster + capacity + countdown-or-waiting-for-more copy.
 * - A round exists (any status, including `"revealed"` between rounds) ->
 *   render the exact same `RoundView` Feature 1's `SignalPanel` uses. Public
 *   and private sessions share round mechanics end to end (see
 *   `gameRounds.ts`'s own mode-agnostic SCOPE note), so there is no
 *   public-lobby-specific round UI to build here — `RoundView` already
 *   handles speaking/voting/reveal and even offers its own manual
 *   "Start round"/"Next round" button for whenever the countdown alone
 *   isn't the only way a round gets going (e.g. host hits capacity before
 *   4 threshold in some future retune, or players want the next round
 *   sooner than a fresh countdown would allow).
 *
 * E3 UPDATE: this screen mounts a voice panel auto-triggering the same
 * PeerJS group-call flow a room's own call button starts, keyed to this
 * session's synthetic `room_id` — present across both the lobby state and
 * the hand-off-to-`RoundView` state below, since voice should stay live
 * across that transition, not just exist pre-round. Originally
 * `PublicLobbyVoice` (a compact mute-only status strip); superseded below
 * by `PublicCallPanel` (see LAYOUT note further down), which keeps the
 * same auto-join behavior but renders full participant video tiles +
 * controls instead, as its own left-hand column rather than a strip
 * embedded in this card.
 *
 * E4 UPDATE: the `RoundView` mounted below (in the round-exists branch) now
 * gets a `postGameActions` render prop, so once a round is `"revealed"` it
 * renders `PostGameActions` ("play again" / "leave") instead of `RoundView`'s
 * own default "Next round" button. "Leave" reuses this screen's own
 * `onLeave`/`isLeaving` props unchanged — the exact same handler already
 * wired to the plain "Leave" button further down in the lobby-roster state,
 * so leaving behaves identically whether it's clicked pre-round or
 * post-round. See `RoundView.tsx`'s own E4 doc comment for why only the
 * `"revealed"` case is replaced, and `PostGameActions.tsx` for why "play
 * again" isn't a second, independent `startRound` path.
 *
 * NOT covered here (left for later phases, per the same "flag it, don't
 * silently expand scope" convention this feature's other sessions used):
 * - [F2b landed] Navigating away without leaving no longer leaves the
 *   player mis-reading as connected — see `useGameSessionPresence.ts`'s own
 *   F2b doc comment. `leaveSession` is still only called from the explicit
 *   "Leave" button below (default lobby state) or `PostGameActions`' "Leave"
 *   (post-round state) — the *seat* itself isn't auto-vacated on navigate
 *   away, only presence is now accurate. Voice still leaves the call on its
 *   own unmount regardless of how that happens, per `PublicLobbyVoice`'s
 *   own header, unchanged by this update.
 *
 * F1e UPDATE: the lobby roster chips now show a disconnected player dimmed
 * with the same global `StatusIndicator` dot `RoundView.tsx`'s
 * `PlayerBadge` reuses (green connected / gray disconnected) plus an
 * "(away)" label — `players` already carried the raw `gamePlayers.connected`
 * field via `getSessionPlayers` before this session (no query change
 * needed here), it just wasn't rendered anywhere yet.
 *
 * H3 UPDATE — third state, checked ahead of the round/lobby switch above:
 * once `session.status === "ended"` (H2's score-threshold auto-end applies
 * to public sessions same as private ones), this screen renders
 * `<Leaderboard>` instead of handing off into `RoundView`/`PostGameActions`
 * — "Play again" there would just call `startRound` into an already-ended
 * session and get rejected. `Leaderboard`'s own `actions` slot carries this
 * screen's existing `onLeave`/`isLeaving` "Leave" button, reused unchanged
 * rather than inventing a second leave path for the post-game state.
 */

type SessionSummary = {
  session_id: string;
  room_id: string;
  status: "waiting" | "in_progress" | "locked" | "ended";
  capacity: number;
  min_players_to_start?: number;
  countdown_started_at?: number;
};

function CountdownRing({ countdownStartedAt }: { countdownStartedAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const msLeft = Math.max(0, countdownStartedAt + AUTOSTART_COUNTDOWN_MS - now);
  const secondsLeft = Math.ceil(msLeft / 1000);
  const percent = Math.min(100, Math.max(0, (msLeft / AUTOSTART_COUNTDOWN_MS) * 100));

  return (
    <div className="flex flex-col items-center gap-2">
      <ProgressCircle progress={percent} size={48} strokeWidth={4} color="currentColor" />
      <p className="text-sm text-gray-200">
        Starting in <span className="tabular-nums font-medium text-white">{secondsLeft}s</span>
      </p>
    </div>
  );
}

export const PublicLobbyScreen = ({
  sessionId,
  onLeave,
  isLeaving,
}: {
  sessionId: string;
  onLeave: () => void;
  isLeaving: boolean;
}) => {
  const { user } = useCurrentUser();
  const session = useQuery(api.gameSessions.getSessionById, { session_id: sessionId }) as
    | SessionSummary
    | null
    | undefined;
  const players = useQuery(api.gameSessions.getSessionPlayers, { session_id: sessionId });
  const roundView = useQuery(api.gameRounds.getRoundView, { session_id: sessionId });

  // F1a: heartbeats for as long as this screen is mounted, i.e. as long as
  // the player is on /orbital/anomaly — see useGameSessionPresence.ts's own
  // header for why this differs from SignalPanel's unconditional-on-panel-
  // close behavior. Called before the early return below (hooks can't
  // follow a conditional return).
  useGameSessionPresence(sessionId);

  // A round is on the board — hand off to the same round UI Feature 1 uses.
  const hasRound = roundView !== undefined && roundView !== null;
  const isLoadingLobby = session === undefined || players === undefined || roundView === undefined;
  // H3: once the session has ended (H2's score-threshold auto-end, same as
  // any other path to "ended"), stop handing off into RoundView/
  // PostGameActions altogether — "Play again" there would just call
  // startRound into an already-`"ended"` session and get rejected. Checked
  // ahead of `hasRound` below so this wins even though a `"revealed"`
  // round (the reveal that triggered the end) is still on the board.
  const hasEnded = session?.status === "ended";

  const capacity = session?.capacity ?? 10;
  const minToStart = session?.min_players_to_start;
  const countdownStartedAt = session?.countdown_started_at;
  const stillNeeded =
    minToStart !== undefined && players !== undefined
      ? Math.max(0, minToStart - players.length)
      : undefined;

  const { setRightMobileMenu } = useUIStore();

  // G2: hoisted to one stable top-level position present on every render
  // (loading / lobby / round alike) — see this file's own header note for
  // why it used to live inside two separate `return`s instead and what
  // that broke. `session &&` is kept as the mount guard (unchanged
  // behavior): no `room_id` to hand it until the session query resolves.
  //
  // LAYOUT: this used to be a bare fragment, rendered inside
  // `PublicLobbyEntry`'s single centered `max-w-md` card — the same shape
  // as the "finding a game"/error states, but wrong once actually seated:
  // a private room gets a 3-column `CallPanel | GameStage | ChatPanel`
  // layout for free from `[room_id]/layout.tsx` (matching the Anomaly
  // mockup), while `/orbital/anomaly` sits under the plain `(main)` shell
  // (`LeftSidebar` + bare content, see that layout's own comment) and had
  // no equivalent — no video panel, no chat, just this card's contents by
  // themselves. Now that there's a seated session (this component only
  // renders once `PublicLobbyEntry`'s matchmaking succeeds), it takes over
  // the full content area itself and lays out the same three columns,
  // keyed to this session's synthetic `room_id`:
  //  - `PublicCallPanel` (left) — participant video tiles + call
  //    controls, the video-panel gap `PublicLobbyVoice`'s old mute-only
  //    strip left unfilled. See that file's own header for why `CallOverlay`
  //    itself isn't reused directly.
  //  - the lobby/round/leaderboard switch below (center) — unchanged
  //    logic, just now the middle column instead of the only content.
  //  - `ChatPanel` (right) — session chat. `publicMatchmaking.ts`'s own
  //    doc comment already named this session's synthetic `room_id` as a
  //    ready-made `conversation_id` for exactly this ("Phase E's
  //    public-lobby UI is expected to read that same conversation_id for
  //    its own chat view") — it just never got built. `ChatPanel` needs
  //    nothing from the `rooms`/`roomMembers` tables (confirmed: `RoomChatUI`
  //    → `ChatUI` → `MessageList`/`ChatInputBar` key everything off the
  //    `room_id` string alone, and `messages.ts`'s `sendMessage` only
  //    *optionally* looks up `roomMembers` for notification fan-out — an
  //    empty result there is a no-op, not an error), so it works unmodified
  //    against a public session's synthetic id with no backend changes.
  if (!session) {
    return (
      <div className="flex flex-col items-center gap-2 py-4">
        <p className="text-xs text-gray-500">Loading lobby…</p>
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col lg:flex-row w-full h-full overflow-y-auto lg:overflow-hidden min-w-0">
      <PublicCallPanel
        roomId={session.room_id}
        playerCount={players?.length ?? 0}
        className="w-full shrink-0 border-b lg:border-b-0 lg:border-r lg:w-80 lg:h-full lg:overflow-hidden"
      />

      <div className="flex-1 min-w-0 flex flex-col items-center justify-center relative p-4">
        <button
          onClick={() => setRightMobileMenu(true)}
          className="lg:hidden absolute top-3 right-3 z-40 w-9 h-9 flex items-center justify-center rounded-full bg-theme-surface border border-theme-border text-gray-300"
        >
          <HugeiconsIcon icon={BubbleChatIcon} className="w-4 h-4" />
        </button>

        <div className="w-full max-w-md flex flex-col items-center text-center gap-4">
      {hasEnded ? (
        <Leaderboard
          sessionId={sessionId}
          currentUserId={user?.user_id}
          actions={
            <Button
              variant="secondary"
              size="md"
              className="w-full"
              disabled={isLeaving}
              onClick={onLeave}
            >
              {isLeaving ? "Leaving..." : "Leave"}
            </Button>
          }
        />
      ) : hasRound ? (
        <RoundView
          sessionId={sessionId}
          postGameActions={({ onPlayAgain, isStarting }) => (
            <PostGameActions
              onPlayAgain={onPlayAgain}
              isStarting={isStarting}
              onLeave={onLeave}
              isLeaving={isLeaving}
            />
          )}
        />
      ) : isLoadingLobby ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <p className="text-xs text-gray-500">Loading lobby…</p>
        </div>
      ) : (
        <>
          <h1 className="text-lg font-medium text-white">You&apos;re in the lobby</h1>

          {countdownStartedAt !== undefined ? (
            <CountdownRing countdownStartedAt={countdownStartedAt} />
          ) : (
            <p className="text-sm text-gray-400">
              {stillNeeded !== undefined && stillNeeded > 0
                ? `Waiting for ${stillNeeded} more player${stillNeeded === 1 ? "" : "s"} to auto-start...`
                : "Waiting for the round to start..."}
            </p>
          )}

          <div className="w-full flex items-center justify-center gap-2 text-gray-300 text-sm bg-theme-hover rounded-xl px-3 py-2">
            <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" />
            <span>
              {players!.length}/{capacity} player{players!.length === 1 ? "" : "s"} here
            </span>
          </div>

          {players!.length > 0 && (
            <div className="w-full flex flex-wrap justify-center gap-2">
              {players!.map((player) => {
                const isSelf = user?.user_id === player.user_id;
                const name = isSelf ? "You" : player.username || "Player";
                const isConnected = player.connected !== false;
                return (
                  <div
                    key={player._id}
                    className="flex items-center gap-1.5 bg-theme-base rounded-full pl-1 pr-3 py-1"
                  >
                    <div className="relative">
                      <UserAvatar
                        avatar={player.avatar}
                        alt={name}
                        size={20}
                        className={`rounded-full w-5 h-5 object-cover overflow-hidden flex items-center justify-center ${!isConnected ? "opacity-50" : ""}`}
                      />
                      <StatusIndicator isOnline={isConnected} isAway={false} />
                    </div>
                    <span className={`text-xs text-gray-200 ${!isConnected ? "opacity-60" : ""}`}>
                      {name}
                      {!isConnected && <span className="text-gray-500"> (away)</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <Button
            variant="secondary"
            size="sm"
            className="mt-2"
            onClick={onLeave}
            disabled={isLeaving}
          >
            {isLeaving ? "Leaving..." : "Leave"}
          </Button>
        </>
      )}
        </div>
      </div>

      <ChatPanel room_id={session.room_id} className="lg:w-80 lg:flex-shrink-0 lg:border-l" />
    </section>
  );
};
