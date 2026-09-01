"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEFAULT_TURN_DURATION_MS } from "@/convex/games/turnOrder";
import { useUserStore } from "@/store/useUserStore";
import { UserAvatar } from "@/components/avatar";
import { Button } from "@/components/ui";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { VotingPanel } from "./VotingPanel";
import { RevealPanel } from "./RevealPanel";

/**
 * C3 — round view: word reveal + current speaker + timer.
 *
 * Mounts inside SignalPanel's body (see SignalPanel.tsx), replacing C2's
 * static placeholder now that there's real round content to show. Reads
 * B5's `getRoundView` for everything round-related (my word, current
 * speaker, turn deadline) and B1's `getSessionPlayers` only for
 * username/avatar lookups to render alongside a user_id.
 *
 * SCOPE: this component only *reads* round state and offers the one
 * action needed to get a round on screen in the first place (`startRound`
 * — there's no button for it anywhere yet, C1/C2 deliberately stopped short
 * of that). `startRound` is reused for both "no round yet" and "previous
 * round revealed" states, since B2's mutation already supports both (it
 * only refuses if the current round exists and isn't `"revealed"`).
 *
 * C4 UPDATE: the `status === "voting"` branch now renders the real
 * VotingPanel (tap-to-vote, wired to B3's castVote) instead of C3's "voting
 * is underway" placeholder sentence.
 * C5 UPDATE: the `status === "revealed"` branch now renders the real
 * RevealPanel (word reveal, accusation breakdown, per-round score deltas,
 * cumulative standings) instead of the old one-line placeholder.
 * Voting is only offered to players actually dealt into the round
 * (`speaking_order.includes(me)`); someone who joined after the round
 * started sees the same "sitting this round out" note used above for a
 * missing `my_word`, and VotingPanel's candidate list is built from
 * `speaking_order` too, so they're excluded as both a voter and a
 * candidate — consistent with them never having gotten a word either.
 *
 * E4 UPDATE — optional `postGameActions` render prop: re-read
 * `gameSessions.ts`/`gameRounds.ts` before adding this (per
 * SIGNAL_PROGRESS.md's own "Next up" note) and confirmed neither table has
 * any notion of a session "ending" after some fixed number of rounds — a
 * `"revealed"` round is the *only* natural boundary point this schema
 * produces, so "post-game" is defined here as "a round has just been
 * revealed," which is exactly when this component's default action button
 * already fires anyway.
 *
 * Default behavior (prop omitted — e.g. Feature 1's `SignalPanel`) is
 * UNCHANGED: still the single "Start round"/"Next round" button, since
 * in-room sessions already have their own end-of-life action (C7's "End
 * Anomaly") and don't need a competing "leave" affordance on every reveal.
 *
 * When passed, `postGameActions` REPLACES the default button for the
 * `"revealed"` case only — the initial `roundView === null` "Start round"
 * button (first round, e.g. a public-lobby player manually starting before
 * the autostart countdown/threshold) is untouched, since there's nothing to
 * "leave" from before a single round has played. `onPlayAgain` is the same
 * `startRound` call the default button already made — E4 doesn't change
 * what "keep playing" does, only offers an explicit "leave" alongside it
 * (see PublicLobbyScreen.tsx / PostGameActions.tsx for the public-lobby
 * caller).
 *
 * F1e UPDATE: `PlayerBadge` now shows a disconnected player as dimmed with
 * the existing global `StatusIndicator` dot (reused as-is — green for
 * connected, gray for `connected === false` — rather than inventing a new
 * indicator) plus a "(disconnected)" label. The voting-phase "X/Y voted"
 * counts (here and in `VotingPanel`) now use `required_voter_ids` (F1d's
 * connected-only roster) instead of the full `speaking_order`, so the
 * number on screen matches what actually triggers auto-reveal rather than
 * counting a disconnected player who's no longer required to vote.
 *
 * Session 5 (GameStage port) — visual restyle only, per the reskin plan:
 * the round pill, word card, and currently-speaking row all got the
 * mockup's card treatment (rounded-2xl, theme-accent glow on the word
 * card). `TurnTimer`'s old `ProgressCircle` (a shared rounded-square
 * component used elsewhere in the app) is replaced here with a local
 * `CountdownRing` — a real circular ring modeled on the mockup's, with
 * its stroke swapped from the mockup's hardcoded `#A855F7` to
 * `hsl(var(--theme-accent-hsl))` so it follows the live accent color
 * (Session 0's token) instead of a fixed purple. No query/mutation/prop
 * shape changed — same data, same states, same `postGameActions`
 * contract PublicLobbyScreen.tsx relies on.
 */

type PlayerSummary = { user_id: string; username?: string; avatar?: string; connected?: boolean };

function PlayerBadge({
  player,
  isSelf,
  emphasized,
}: {
  player: PlayerSummary | undefined;
  isSelf: boolean;
  emphasized?: boolean;
}) {
  const name = player?.username || "Unknown";
  // F1e: reuses the same online/away/offline dot presence.ts's global
  // StatusIndicator already renders elsewhere (friends list, room members,
  // etc.) rather than inventing new visual language for "disconnected" —
  // `connected === false` (F1a/F1b's write path) maps to the dot's
  // "offline" (gray) state; missing/`true` maps to "online" (green), same
  // `!== false` convention every backend connected-check already uses.
  const isConnected = player?.connected !== false;
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <UserAvatar
          avatar={player?.avatar}
          alt={name}
          size={28}
          className={`rounded-full object-cover bg-theme-base overflow-hidden flex items-center justify-center ${emphasized ? "ring-2 ring-theme-accent" : "ring-1 ring-theme-border"} ${!isConnected ? "opacity-50" : ""}`}
        />
        <StatusIndicator isOnline={isConnected} isAway={false} />
      </div>
      <span className={`text-sm ${emphasized ? "text-white font-medium" : "text-gray-300"} ${!isConnected ? "opacity-60" : ""}`}>
        {isSelf ? "You" : name}
        {!isConnected && <span className="text-gray-500"> (disconnected)</span>}
      </span>
    </div>
  );
}

/**
 * Session 5 — modeled on the anomaly-ui mockup's own local `CountdownRing`
 * (a real circular `<circle>` ring with `strokeDasharray`/`strokeDashoffset`
 * progress), not the shared `ProgressCircle` component (a rounded-square
 * shape used elsewhere in the app for unrelated progress UI — swapping
 * its shape here would've changed it everywhere it's used). Per the plan's
 * explicit color swap: the mockup's ring stroke was a hardcoded
 * `#A855F7`; here it's `hsl(var(--theme-accent-hsl))` so it tracks the
 * live accent color instead.
 */
function CountdownRing({
  secondsLeft,
  percent,
  size = 40,
}: {
  secondsLeft: number;
  percent: number;
  size?: number;
}) {
  const strokeWidth = 3;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg
        className="-rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--theme-border))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--theme-accent-hsl))"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.2s linear" }}
        />
      </svg>
      <span className="absolute text-[10px] font-medium text-white tabular-nums">
        {secondsLeft}
      </span>
    </div>
  );
}

function TurnTimer({ turnExpiresAt }: { turnExpiresAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const msLeft = Math.max(0, turnExpiresAt - now);
  const secondsLeft = Math.ceil(msLeft / 1000);
  const percent = Math.min(100, Math.max(0, (msLeft / DEFAULT_TURN_DURATION_MS) * 100));

  return <CountdownRing secondsLeft={secondsLeft} percent={percent} />;
}

export const RoundView = ({
  sessionId,
  postGameActions,
}: {
  sessionId: string;
  /**
   * E4: when provided, replaces the default "Next round" button once the
   * current round is `"revealed"` — see this file's own E4 doc comment
   * above for why only that case, not the initial "Start round" one, is
   * eligible for replacement. Receives the same `startRound` trigger and
   * in-flight flag this component already tracks for its own button, so
   * "play again" behaves identically to the default "Next round" click.
   */
  postGameActions?: (ctx: { onPlayAgain: () => void; isStarting: boolean }) => React.ReactNode;
}) => {
  const currentUser = useUserStore((state) => state.user);
  const roundView = useQuery(api.gameRounds.getRoundView, { session_id: sessionId });
  const players = useQuery(api.gameSessions.getSessionPlayers, { session_id: sessionId });
  const startRound = useMutation(api.gameRounds.startRound);
  const [isStarting, setIsStarting] = useState(false);

  const playersById = useMemo(() => {
    const map = new Map<string, PlayerSummary>();
    (players ?? []).forEach((p) => map.set(p.user_id, p));
    return map;
  }, [players]);

  const handleStartRound = async () => {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const result = await startRound({ session_id: sessionId });
      if (!result || "error" in result) {
        toast.error((result && "error" in result && result.error) || "Couldn't start the round");
      }
    } finally {
      setIsStarting(false);
    }
  };

  if (roundView === undefined || players === undefined) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center py-8">
        <p className="text-xs text-gray-500">Loading round…</p>
      </div>
    );
  }

  const canStart = players.length >= 3;
  const isRevealed = roundView !== null && roundView.status === "revealed";
  // E4: a caller-supplied postGameActions takes over the revealed case
  // entirely — the default button only covers the initial "Start round"
  // case then, per this file's own E4 doc comment above.
  const showDefaultStartAction = roundView === null || (isRevealed && !postGameActions);
  const showPostGameActions = isRevealed && !!postGameActions;

  return (
    <div className="flex flex-col gap-5 items-center text-center w-full max-w-md mx-auto">
      {roundView && (
        <div className="flex items-center gap-2 rounded-full border border-theme-border bg-theme-hover px-3.5 py-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          <span className="text-xs font-semibold tracking-wide text-gray-300">
            Round {roundView.round_number}
          </span>
        </div>
      )}

      {roundView === null && (
        <>
          <p className="text-sm text-gray-200">Ready when you are.</p>
          <p className="text-xs text-gray-500">
            {players.length} player{players.length === 1 ? "" : "s"} in this session
            {!canStart && " \u2014 need at least 3 to start"}
          </p>
        </>
      )}

      {roundView && roundView.my_word && (
        <div
          className="w-full rounded-2xl border border-theme-border bg-theme-base px-6 py-6 flex flex-col items-center gap-1.5"
          style={{ boxShadow: "0 0 35px -8px hsl(var(--theme-accent-hsl) / 0.3)" }}
        >
          <div className="text-[10px] uppercase tracking-[0.2em] text-theme-accent font-medium">
            Your word
          </div>
          <div className="text-2xl font-bold text-white">{roundView.my_word}</div>
        </div>
      )}
      {roundView && !roundView.my_word && (
        <p className="text-xs text-gray-500">You&apos;re sitting this round out.</p>
      )}

      {roundView && roundView.status === "speaking" && (
        <div className="w-full flex items-center justify-between rounded-2xl border border-theme-border bg-theme-hover px-4 py-3">
          <div className="flex items-center gap-2.5">
            <HugeiconsIcon icon={Mic01Icon} className="w-4 h-4 text-theme-accent" />
            <PlayerBadge
              player={
                roundView.current_speaker_user_id
                  ? playersById.get(roundView.current_speaker_user_id)
                  : undefined
              }
              isSelf={roundView.current_speaker_user_id === currentUser?.user_id}
              emphasized
            />
          </div>
          {roundView.turn_expires_at != null && (
            <TurnTimer turnExpiresAt={roundView.turn_expires_at} />
          )}
        </div>
      )}

      {roundView && roundView.status === "voting" && currentUser && (
        roundView.speaking_order.includes(currentUser.user_id) ? (
          <VotingPanel
            sessionId={sessionId}
            speakingOrder={roundView.speaking_order}
            requiredVoterIds={roundView.required_voter_ids}
            voteTally={roundView.vote_tally}
            votedUserIds={roundView.voted_user_ids}
            myVotedForId={roundView.my_voted_for_id}
            currentUserId={currentUser.user_id}
            playersById={playersById}
          />
        ) : (
          <div className="w-full rounded-2xl border border-theme-border px-4 py-3 text-xs text-gray-400">
            Voting is underway ({roundView.voted_user_ids.length}/{roundView.required_voter_ids.length} voted) —
            you weren&apos;t in on this round.
          </div>
        )
      )}

      {roundView && roundView.status === "revealed" && roundView.reveal && (
        <RevealPanel
          reveal={roundView.reveal}
          playersById={playersById}
          players={players}
          currentUserId={currentUser?.user_id}
        />
      )}

      {showPostGameActions &&
        postGameActions!({ onPlayAgain: handleStartRound, isStarting })}

      {showDefaultStartAction && (
        <Button
          variant="primary"
          size="md"
          disabled={!canStart || isStarting}
          loading={isStarting}
          onClick={handleStartRound}
        >
          {roundView === null ? "Start round" : "Next round"}
        </Button>
      )}
    </div>
  );
};
