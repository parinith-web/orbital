"use client";

import { useMemo } from "react";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon, ViewOffIcon, Medal01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";

/**
 * C5 — reveal/results screen, wired to B5's `getRoundView().reveal`.
 *
 * Rendered by RoundView once `status === "revealed"`, replacing C3/C4's
 * placeholder sentence for that phase. Pure rendering only — everything it
 * needs (who was off-signal, both words, the accusation breakdown, and
 * per-round score deltas) is already computed server-side by A4's
 * `computeRoundResult` and passed through untouched via `reveal`. No new
 * query or mutation work; per the C4 session notes this was expected to be
 * a rendering-only session, and it is.
 *
 * Shows two distinct pieces of "score":
 *  - Per-round deltas (reveal.scoreDeltas) — who gained points THIS round
 *    and why, e.g. "+1 for correctly naming the off-signal player" or
 *    "+2 for evading."
 *  - Cumulative session totals (`players` prop, i.e. B1's
 *    `getSessionPlayers` — already live-subscribed by RoundView and
 *    already reflects this round's deltas, since B3's `performReveal`
 *    patches `gamePlayers.score` before this state is ever shown) as a
 *    small standings list, since "who's actually ahead for the session"
 *    is a different question than "what just happened," and C4's session
 *    notes flagged that both were worth showing rather than picking one.
 *
 * No Trophy icon exists in this icon set (checked before building) —
 * CrownIcon stands in for the "players won" state, matching the visual
 * register other emphasis states in this codebase use (PlayerBadge's
 * ring-2 ring-theme-accent, etc.) without introducing a new one.
 */

type PlayerSummary = { user_id: string; username?: string; avatar?: string; score?: number };

interface RevealData {
  word_main: string;
  word_offsignal: string;
  offSignalUserId: string;
  playersWon: boolean;
  accusation: {
    topVotedUserIds: string[];
    isTie: boolean;
    voteCounts: Record<string, number>;
  };
  scoreDeltas: { user_id: string; delta: number }[];
}

function nameFor(playersById: Map<string, PlayerSummary>, userId: string, currentUserId?: string) {
  if (userId === currentUserId) return "You";
  return playersById.get(userId)?.username || "Unknown";
}

export const RevealPanel = ({
  reveal,
  playersById,
  players,
  currentUserId,
}: {
  reveal: RevealData;
  playersById: Map<string, PlayerSummary>;
  players: PlayerSummary[];
  currentUserId?: string;
}) => {
  const { playersWon, offSignalUserId, accusation, scoreDeltas, word_main, word_offsignal } = reveal;

  const deltaByUserId = useMemo(() => {
    const map = new Map<string, number>();
    scoreDeltas.forEach((d) => map.set(d.user_id, d.delta));
    return map;
  }, [scoreDeltas]);

  const standings = useMemo(
    () => [...players].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)),
    [players],
  );

  const accusedNames = accusation.topVotedUserIds.map((id) => nameFor(playersById, id, currentUserId));

  return (
    <div className="w-full flex flex-col gap-4 text-center">
      <div
        className={`w-full flex flex-col items-center gap-1 rounded-xl border px-4 py-4 ${
          playersWon ? "border-theme-accent bg-theme-hover" : "border-theme-border bg-theme-base"
        }`}
      >
        <HugeiconsIcon
          icon={playersWon ? CrownIcon : ViewOffIcon}
          className={`w-6 h-6 ${playersWon ? "text-theme-accent" : "text-gray-500"}`}
        />
        <div className="text-sm font-medium text-white">
          {playersWon
            ? "Caught! The players win this round."
            : `${nameFor(playersById, offSignalUserId, currentUserId)} evaded detection.`}
        </div>
        <div className="text-xs text-gray-500">
          {accusation.topVotedUserIds.length === 0
            ? "No one voted."
            : accusation.isTie
              ? `Tied vote between ${accusedNames.join(" and ")} — no one was caught.`
              : `Most votes went to ${accusedNames[0]}.`}
        </div>
      </div>

      <div className="w-full grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-theme-border bg-theme-base px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Main word</div>
          <div className="text-sm text-white">{word_main}</div>
        </div>
        <div className="rounded-xl border border-theme-border bg-theme-base px-3 py-2">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 mb-1">Off-signal word</div>
          <div className="text-sm text-white">{word_offsignal}</div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {nameFor(playersById, offSignalUserId, currentUserId)} was off-signal
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-1.5 text-left">
        <div className="text-[10px] uppercase tracking-wide text-gray-500 px-0.5">Standings</div>
        {standings.map((player, index) => {
          const name = player.user_id === currentUserId ? "You" : player.username || "Unknown";
          const delta = deltaByUserId.get(player.user_id);
          return (
            <div
              key={player.user_id}
              className="w-full flex items-center justify-between rounded-lg border border-theme-border px-3 py-1.5"
            >
              <div className="flex items-center gap-2">
                {index === 0 && (player.score ?? 0) > 0 ? (
                  <HugeiconsIcon icon={Medal01Icon} className="w-4 h-4 text-theme-accent" />
                ) : (
                  <span className="text-xs text-gray-500 w-4 text-center">{index + 1}</span>
                )}
                <Image
                  src={getAvatarUrl(player.avatar, name)}
                  alt={name}
                  width={24}
                  height={24}
                  quality={25}
                  className="rounded-full object-cover bg-theme-base ring-1 ring-theme-border"
                />
                <span className="text-sm text-gray-300">{name}</span>
              </div>
              <div className="flex items-center gap-2">
                {delta != null && (
                  <span className="text-xs tabular-nums text-theme-accent">+{delta}</span>
                )}
                <span className="text-sm tabular-nums text-white">{player.score ?? 0}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
