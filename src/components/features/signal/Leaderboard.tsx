"use client";

import type React from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { WINNING_SCORE } from "@/convex/games/lobbyConfig";
import { HugeiconsIcon } from "@hugeicons/react";
import { CrownIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";

/**
 * H3 — the leaderboard shown once a session has `status === "ended"`
 * (H2's score-threshold end condition), replacing the old "panel just
 * closes" behavior both `SignalPanel.tsx` (in-room) and
 * `PublicLobbyScreen.tsx` (public lobby) used to fall back to.
 *
 * Reads `gameSessions.getLeaderboard` directly rather than taking players
 * as a prop — same "small presentational-ish component owns its own live
 * query" shape `RoundView` already uses for `getRoundView`, so this can be
 * dropped into either caller with just a `sessionId`.
 *
 * PODIUM + LIST: the plan's own H3 line is "podium for top 3, list below."
 * The podium always shows the first 3 *rows* of the sorted-by-score
 * result — not "the 3 highest distinct scores" — so a 4+-way tie at rank 1
 * would still only put 3 of those tied players on the podium, with the
 * rest starting the list below (still correctly labeled "#1", per the
 * shared-rank contract; the podium is a visual highlight of the top of the
 * list, not a second, independent ranking). Everyone from the 4th row on
 * down renders in the plain list, mirroring `RevealPanel.tsx`'s existing
 * standings-list styling so this reads as the same family of screen.
 *
 * `actions` is an optional slot for a caller-supplied action row (e.g.
 * `PublicLobbyEntry`'s "Leave" button) rendered below the standings —
 * `SignalPanel` already has its own header Close/End-Signal controls and
 * passes nothing; `PublicLobbyScreen` has no such chrome and passes its
 * existing leave affordance through here instead of inventing a second
 * one. Kept as a plain ReactNode (not a render-prop) since, unlike
 * `RoundView`'s `postGameActions`, nothing here needs to hand the caller
 * anything back.
 */

type LeaderboardEntry = {
  user_id: string;
  username?: string;
  avatar?: string;
  score: number;
  offsignal_count: number;
  rank: number;
};

function medalTone(rank: number) {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-gray-300";
  if (rank === 3) return "text-amber-600";
  return "text-gray-500";
}

function PodiumCard({ entry, isSelf }: { entry: LeaderboardEntry; isSelf: boolean }) {
  const name = isSelf ? "You" : entry.username || "Unknown";
  return (
    <div
      className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 ${
        entry.rank === 1
          ? "border-theme-accent bg-theme-hover"
          : "border-theme-border bg-theme-base"
      }`}
    >
      <div className={`text-xs font-medium ${medalTone(entry.rank)}`}>#{entry.rank}</div>
      <Image
        src={getAvatarUrl(entry.avatar, name)}
        alt={name}
        width={40}
        height={40}
        quality={25}
        className={`rounded-full object-cover bg-theme-base ${
          entry.rank === 1 ? "ring-2 ring-theme-accent" : "ring-1 ring-theme-border"
        }`}
      />
      <div className="text-sm text-white font-medium truncate max-w-full">{name}</div>
      <div className="text-sm tabular-nums text-theme-accent font-medium">{entry.score}</div>
    </div>
  );
}

function ListRow({ entry, isSelf }: { entry: LeaderboardEntry; isSelf: boolean }) {
  const name = isSelf ? "You" : entry.username || "Unknown";
  return (
    <div className="w-full flex items-center justify-between rounded-lg border border-theme-border px-3 py-1.5">
      <div className="flex items-center gap-2">
        <span className={`text-xs w-6 text-center ${medalTone(entry.rank)}`}>#{entry.rank}</span>
        <Image
          src={getAvatarUrl(entry.avatar, name)}
          alt={name}
          width={24}
          height={24}
          quality={25}
          className="rounded-full object-cover bg-theme-base ring-1 ring-theme-border"
        />
        <span className="text-sm text-gray-300">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1 text-[11px] text-gray-500">
          <HugeiconsIcon icon={ViewOffSlashIcon} className="w-3 h-3" />
          {entry.offsignal_count}
        </span>
        <span className="text-sm tabular-nums text-white">{entry.score}</span>
      </div>
    </div>
  );
}

export const Leaderboard = ({
  sessionId,
  currentUserId,
  actions,
}: {
  sessionId: string;
  currentUserId?: string;
  actions?: React.ReactNode;
}) => {
  const leaderboard = useQuery(api.gameSessions.getLeaderboard, { session_id: sessionId }) as
    | LeaderboardEntry[]
    | undefined;

  if (leaderboard === undefined) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-center py-8">
        <p className="text-xs text-gray-500">Loading leaderboard…</p>
      </div>
    );
  }

  const podium = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);
  const winner = leaderboard[0];

  return (
    <div className="w-full flex flex-col gap-4 text-center">
      <div className="w-full flex flex-col items-center gap-1 rounded-xl border border-theme-accent bg-theme-hover px-4 py-4">
        <HugeiconsIcon icon={CrownIcon} className="w-6 h-6 text-theme-accent" />
        <div className="text-sm font-medium text-white">Game over!</div>
        {winner && (
          <div className="text-xs text-gray-500">
            {winner.user_id === currentUserId ? "You" : winner.username || "A player"} reached{" "}
            {WINNING_SCORE} points
            {winner.rank === 1 && leaderboard.filter((e) => e.rank === 1).length > 1
              ? " — tied for the win"
              : ""}
            .
          </div>
        )}
      </div>

      {podium.length > 0 && (
        <div className="w-full flex items-stretch gap-2">
          {podium.map((entry) => (
            <PodiumCard
              key={entry.user_id}
              entry={entry}
              isSelf={entry.user_id === currentUserId}
            />
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="w-full flex flex-col gap-1.5 text-left">
          <div className="text-[10px] uppercase tracking-wide text-gray-500 px-0.5">
            Standings
          </div>
          {rest.map((entry) => (
            <ListRow key={entry.user_id} entry={entry} isSelf={entry.user_id === currentUserId} />
          ))}
        </div>
      )}

      {actions}
    </div>
  );
};
