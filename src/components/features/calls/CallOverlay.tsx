"use client";

import { useCallStore } from "@/store/callStore";
import { ParticipantGrid } from "./ParticipantGrid";
import { CallControls } from "./CallControls";
import { CallOverlayHeader } from "./CallOverlayHeader";
import { usePathname } from "next/navigation";

/**
 * H7.2 — repurposed from a full-screen (`fixed inset-0 z-[9999]`) modal
 * takeover into a docked section, originally `GameRoomSidePanel`'s call
 * slot. Session 3's layout restructure moved that slot into its own
 * `CallPanel.tsx` component (still the same call section, just no longer
 * sharing a column with chat below it) — see `CallPanel.tsx` for where
 * this mounts today.
 *
 * Pre-H7, this was the only place Anomaly ever rendered (`<SignalPanel />`
 * mounted here, centered over the call UI) — see `GameStage.tsx`'s own
 * header comment for why that coupling was backwards for a game-first
 * room. Now that `GameStage` is the room page's permanent, call-
 * independent center-stage, `<SignalPanel />` is dropped from here
 * entirely rather than kept as a second, redundant place the same live
 * session could render (and duplicate-mutate) from. `SignalPanel.tsx`
 * itself is untouched, just no longer mounted anywhere — its own trigger
 * (`CallControls`'s old "Play Anomaly" button) is retired in this same
 * session for the same reason; see that file's comment.
 *
 * `isCallOverlayOpen` (uiStore) is deliberately no longer part of the
 * gate below — that flag used to mean "is the full-screen takeover
 * open", which doesn't apply to a permanently-docked panel. Other code
 * (`useCallSessionActions`, `ActiveCallPanel`, `CallControls`'s leave
 * handler) still writes to it, harmlessly — this component just no
 * longer reads it. `isActive && isOnCorrectPage` alone now decides
 * whether the docked call section shows: joined (or joining) to THIS
 * room's call, full stop.
 *
 * Session 4 (CallPanel port) — resolves the sizing TODO above: instead of
 * a fixed `h-72` box, this now fills whatever vertical space `CallPanel`
 * has left after `RoomIdentityHeader` (`flex-1 min-h-0` on this
 * component's own root, rendered directly as `RoomIdentityHeader`'s flex
 * sibling in `CallPanel.tsx` — no wrapper div needed). `CallOverlayHeader`
 * and `CallControls` are both normal (non-absolute) flow items now — top
 * and bottom of this column respectively — with `ParticipantGrid` as the
 * `flex-1 overflow-y-auto` middle. That's also why both of those
 * components dropped their old `absolute` positioning and
 * `ParticipantGrid` dropped its `pt-16`/`pb-20` spacing hacks: none of
 * them need to leave clearance for an overlay anymore, they're just
 * stacked in document flow.
 */
export const CallOverlay = () => {
  const pathname = usePathname();
  const { actualRoomId, status } = useCallStore();
  const isActive = status === "joined" || status === "joining";

  const isOnCorrectPage = actualRoomId
    ? pathname.includes(`/orbital/room/${actualRoomId}`)
    : false;

  if (!isActive || !isOnCorrectPage) {
    return null;
  }

  return (
    <div className="relative w-full flex-1 min-h-0 flex flex-col bg-theme-base overflow-hidden">
      <CallOverlayHeader />
      <ParticipantGrid />
      <CallControls />
    </div>
  );
};
