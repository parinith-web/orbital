"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DEFAULT_TURN_DURATION_MS } from "@/convex/games/turnOrder";
import { useUserStore } from "@/store/useUserStore";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { Button } from "@/components/ui";
import { ProgressCircle } from "@/components/ui/ProgressCircle";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { HugeiconsIcon } from "@hugeicons/react";
import { Mic01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
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
 * Signal") and don't need a competing "leave" affordance on every reveal.
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
        <Image
          src={getAvatarUrl(player?.avatar, name)}
          alt={name}
          width={28}
          height={28}
          quality={25}
          className={`rounded-full object-cover bg-theme-base ${emphasized ? "ring-2 ring-theme-accent" : "ring-1 ring-theme-border"} ${!isConnected ? "opacity-50" : ""}`}
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

function TurnTimer({ turnExpiresAt }: { turnExpiresAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(interval);
  }, []);

  const msLeft = Math.max(0, turnExpiresAt - now);
  const secondsLeft = Math.ceil(msLeft / 1000);
  const percent = Math.min(100, Math.max(0, (msLeft / DEFAULT_TURN_DURATION_MS) * 100));

  return (
    <div className="flex items-center gap-1.5 text-gray-400">
      <ProgressCircle progress={percent} size={28} strokeWidth={3} color="currentColor" />
      <span className="text-xs tabular-nums w-5 text-center">{secondsLeft}</span>
    </div>
  );
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
    <div className="flex flex-col gap-5 items-center text-center w-full">
      {roundView && (
        <div className="text-xs text-gray-500">Round {roundView.round_number}</div>
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
        <div className="w-full rounded-xl border border-theme-border bg-theme-base px-4 py-3">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Your word</div>
          <div className="text-lg font-medium text-white">{roundView.my_word}</div>
        </div>
      )}
      {roundView && !roundView.my_word && (
        <p className="text-xs text-gray-500">You&apos;re sitting this round out.</p>
      )}

      {roundView && roundView.status === "speaking" && (
        <div className="w-full flex items-center justify-between rounded-xl border border-theme-border px-4 py-3">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Mic01Icon} className="w-4 h-4 text-gray-500" />
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
          <div className="w-full rounded-xl border border-theme-border px-4 py-3 text-xs text-gray-400">
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
