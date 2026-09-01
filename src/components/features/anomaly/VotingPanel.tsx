"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserAvatar } from "@/components/avatar";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";

/**
 * C4 — voting UI, wired to B3's `castVote`.
 *
 * Renders inside RoundView (replacing its old `status === "voting"`
 * placeholder sentence) once a round leaves the speaking phase. Candidates
 * are every OTHER player in `speaking_order` — the fixed per-round roster
 * B3 already treats as "who must vote" for auto-reveal, and the same set
 * castVote validates `voted_for_id` against via `getGamePlayer`. Self is
 * excluded client-side to match castVote's own "can't vote for yourself"
 * rule rather than letting the user tap it and bounce off a toast.
 *
 * Voting is a live upsert, not a one-shot pick: castVote already treats a
 * second call from the same voter as "change my vote" (see gameRounds.ts),
 * so this component stays tappable/re-selectable up until reveal rather
 * than locking after the first tap. `my_voted_for_id` (added to B5's
 * getRoundView alongside this component) is what lets the current
 * selection survive a refresh instead of only existing as local state.
 *
 * Vote counts are live and visible to everyone per the PRD's tap-to-vote
 * loop and the redaction rule already baked into getRoundView (aggregate
 * tally + who's-voted are public; who-voted-for-whom stays server-side).
 * F1e UPDATE: candidates whose `connected === false` (F1a/F1b's write
 * path) render dimmed with the same global `StatusIndicator` dot
 * `RoundView.tsx`'s `PlayerBadge` reuses — no new indicator invented.
 * `votesNeeded` now comes from `requiredVoterIds` (F1d's connected-only
 * roster), not `speakingOrder.length` — a disconnected candidate is still
 * tappable (their prior vote, if any, still counts, and they could
 * reconnect and vote again), they just aren't counted toward "how many
 * more votes until reveal."
 *
 * Session 5 (GameStage port) — visual restyle only. The anomaly-ui
 * mockup's voting screen shows generic "Submit vote"/"Skip vote" buttons,
 * but those are placeholder UI with no candidate list or backing mutation
 * behind them — there's no "skip" concept in `gameRounds.ts` at all. Real
 * voting here is (and stays) tap-a-candidate-to-vote, wired to `castVote`
 * above; this session applies the mockup's bolder rounded-2xl card
 * language to that real list rather than swapping in non-functional
 * buttons. Selected-candidate state now uses the theme-accent token
 * (`bg-theme-accent/10`, enabled by Session 0's `--theme-accent-hsl`
 * var) instead of the old plain `bg-theme-hover`, so "this is my pick"
 * reads as accent-colored rather than just a generic hover shade.
 */

type PlayerSummary = { user_id: string; username?: string; avatar?: string; connected?: boolean };

export const VotingPanel = ({
  sessionId,
  speakingOrder,
  requiredVoterIds,
  voteTally,
  votedUserIds,
  myVotedForId,
  currentUserId,
  playersById,
}: {
  sessionId: string;
  speakingOrder: string[];
  requiredVoterIds: string[];
  voteTally: Record<string, number>;
  votedUserIds: string[];
  myVotedForId: string | null;
  currentUserId: string;
  playersById: Map<string, PlayerSummary>;
}) => {
  const castVote = useMutation(api.gameRounds.castVote);
  // Tracks only the in-flight candidate so the other rows stay tappable
  // (and visually undisturbed) while one vote is mid-flight — a slow
  // network shouldn't freeze the whole list over a single tap.
  const [pendingFor, setPendingFor] = useState<string | null>(null);

  const candidates = speakingOrder.filter((userId) => userId !== currentUserId);
  const votedCount = votedUserIds.length;
  const votesNeeded = requiredVoterIds.length;

  const handleVote = async (votedForId: string) => {
    if (pendingFor) return;
    if (votedForId === myVotedForId) return; // already my current pick, no-op
    setPendingFor(votedForId);
    try {
      const result = await castVote({ session_id: sessionId, voted_for_id: votedForId });
      if (!result || "error" in result) {
        toast.error((result && "error" in result && result.error) || "Couldn't cast that vote");
      }
    } finally {
      setPendingFor(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wide text-gray-500 px-0.5">
        <span>Who&apos;s off-signal?</span>
        <span className="tabular-nums normal-case">
          {votedCount}/{votesNeeded} voted
        </span>
      </div>

      <div className="w-full flex flex-col gap-1.5">
        {candidates.map((userId) => {
          const player = playersById.get(userId);
          const name = player?.username || "Unknown";
          const count = voteTally[userId] ?? 0;
          const isMyPick = userId === myVotedForId;
          const isPending = pendingFor === userId;
          const isConnected = player?.connected !== false;

          return (
            <button
              key={userId}
              type="button"
              onClick={() => handleVote(userId)}
              disabled={isPending}
              className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all duration-150 ease-in-out disabled:opacity-60 ${
                isMyPick
                  ? "border-theme-accent bg-theme-accent/10"
                  : "border-theme-border hover:bg-theme-border"
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="relative">
                  <UserAvatar
                    avatar={player?.avatar}
                    alt={name}
                    size={26}
                    className={`rounded-full object-cover bg-theme-base ring-1 ring-theme-border overflow-hidden flex items-center justify-center ${!isConnected ? "opacity-50" : ""}`}
                  />
                  <StatusIndicator isOnline={isConnected} isAway={false} />
                </div>
                <span className={`text-sm ${isMyPick ? "text-white font-medium" : "text-gray-300"} ${!isConnected ? "opacity-60" : ""}`}>
                  {name}
                  {!isConnected && <span className="text-gray-500"> (disconnected)</span>}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {count > 0 && (
                  <span className="text-xs tabular-nums text-gray-500">
                    {count} vote{count === 1 ? "" : "s"}
                  </span>
                )}
                {isMyPick && (
                  <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4 text-theme-accent" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {myVotedForId && (
        <p className="text-[11px] text-gray-500 text-center pt-0.5">
          You can change your vote until everyone&apos;s in.
        </p>
      )}
    </div>
  );
};
