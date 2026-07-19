"use client";

import { Button } from "@/components/ui";

/**
 * E4 — post-game screen: "play again" vs "leave", per PRD §6 Flow B
 * ("post-game screen offers 'play again' (stays in same room, new round) or
 * 'leave' (returns to Portal home)").
 *
 * PUBLIC-LOBBY ONLY: passed into `RoundView` as its `postGameActions` render
 * prop (see that file's own E4 doc comment) only from `PublicLobbyScreen`.
 * Feature 1's `SignalPanel` doesn't pass this — in-room sessions already
 * have C7's explicit "End Signal" action, and don't need a second, competing
 * "leave" affordance appearing on every single reveal.
 *
 * Deliberately thin / stateless: both buttons' actual logic already lives
 * one level up —
 *   - `onPlayAgain` is `RoundView`'s own `handleStartRound`, passed straight
 *     through by `RoundView` itself (see its `postGameActions` ctx arg) —
 *     this component doesn't call `startRound` a second, independent way.
 *   - `onLeave`/`isLeaving` are the exact same props `PublicLobbyScreen`
 *     already threads down to its plain "Leave" button in the lobby-roster
 *     state (owned by `PublicLobbyEntry`'s `handleLeave`, which calls
 *     `leaveSession` then routes back to Portal home) — reused here rather
 *     than a second leave path, so "leave" behaves identically whether it's
 *     clicked pre-round or post-round.
 * This mirrors this feature's existing convention (`PublicLobbyVoice`,
 * `VotingPanel`, etc.) of small presentational components fed entirely by
 * props from a single stateful parent, rather than each one re-deriving its
 * own copy of session state.
 */
export const PostGameActions = ({
  onPlayAgain,
  isStarting,
  onLeave,
  isLeaving,
}: {
  onPlayAgain: () => void;
  isStarting: boolean;
  onLeave: () => void;
  isLeaving: boolean;
}) => {
  return (
    <div className="w-full flex flex-col items-center gap-2">
      <p className="text-xs text-gray-500">Round&apos;s over — keep going, or head out?</p>
      <div className="w-full flex gap-2">
        <Button
          variant="secondary"
          size="md"
          className="flex-1"
          disabled={isLeaving || isStarting}
          onClick={onLeave}
        >
          {isLeaving ? "Leaving..." : "Leave"}
        </Button>
        <Button
          variant="primary"
          size="md"
          className="flex-1"
          disabled={isLeaving || isStarting}
          loading={isStarting}
          onClick={onPlayAgain}
        >
          Play again
        </Button>
      </div>
    </div>
  );
};
