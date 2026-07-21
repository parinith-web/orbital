"use client";

import { useCallStore } from "@/store/callStore";
import { ParticipantGrid } from "./ParticipantGrid";
import { CallControls } from "./CallControls";
import { CallOverlayHeader } from "./CallOverlayHeader";
import { usePathname } from "next/navigation";

/**
 * H7.2 — repurposed from a full-screen (`fixed inset-0 z-[9999]`) modal
 * takeover into a docked section of `GameRoomSidePanel`'s call slot.
 *
 * Pre-H7, this was the only place Signal ever rendered (`<SignalPanel />`
 * mounted here, centered over the call UI) — see `GameStage.tsx`'s own
 * header comment for why that coupling was backwards for a game-first
 * room. Now that `GameStage` is the room page's permanent, call-
 * independent center-stage, `<SignalPanel />` is dropped from here
 * entirely rather than kept as a second, redundant place the same live
 * session could render (and duplicate-mutate) from. `SignalPanel.tsx`
 * itself is untouched, just no longer mounted anywhere — its own trigger
 * (`CallControls`'s old "Play Signal" button) is retired in this same
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
 * Sized to a fixed `h-72` rather than filling all remaining vertical
 * space, since it shares its column with chat below it (see
 * `GameRoomSidePanel.tsx`) — unlike its old full-viewport life, it no
 * longer owns the whole screen to lay itself out in.
 */
export const CallOverlay = () => {
  const pathname = usePathname();
  const { actualRoomId, status } = useCallStore();
  const isActive = status === "joined" || status === "joining";

  const isOnCorrectPage = actualRoomId
    ? pathname.includes(`/portal/room/${actualRoomId}`)
    : false;

  if (!isActive || !isOnCorrectPage) {
    return null;
  }

  return (
    <div className="relative w-full h-72 shrink-0 bg-theme-base overflow-hidden">
      <CallOverlayHeader />
      <ParticipantGrid />
      <CallControls />
    </div>
  );
};
