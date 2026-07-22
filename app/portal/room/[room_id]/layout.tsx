"use client";

import { useParams } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { CallPanel } from "@/components/features/rooms/CallPanel";
import { ChatPanel } from "@/components/features/rooms/ChatPanel";
import { RoomCallProvider } from "@/contexts/CallContext";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";

/**
 * Session 3 (layout restructure scaffold) — replaces the single docked
 * `GameRoomSidePanel` (H7.2) with a true 3-column layout matching the
 * Anomaly mockup's `CallPanel | GameStage | ChatPanel` order:
 * `LeftSidebar | CallPanel | GameStage (children) | ChatPanel`.
 *
 * `GameRoomSidePanel.tsx`, the single combined panel this replaced, was
 * kept in place unrouted as a rollback reference through Session 5 and
 * retired (deleted) in Session 6 once the split was confirmed to have
 * full parity — see `CallPanel.tsx`'s header comment for the original
 * combined-panel reasoning this replaces.
 *
 * RESPONSIVE: `flex-col` on mobile, `lg:flex-row` at the `lg` breakpoint,
 * reusing the mockup's own breakpoint behavior. `CallPanel` stacks inline
 * in that flow on mobile (full-width, above `GameStage`); `ChatPanel`
 * deliberately does NOT — it keeps the old slide-in drawer treatment
 * (`rightMobileMenu`) instead of stacking a third block below the game,
 * since burying the game under a full call + chat stack on a phone would
 * be a regression. See `ChatPanel.tsx`'s header comment for the full
 * reasoning; flagged here too since it's a deviation from the mockup's
 * literal `flex-col` stack.
 *
 * The mobile toggle button below (`rightMobileMenu`) is unchanged from
 * before — it now opens `ChatPanel` specifically rather than the old
 * combined call+chat panel.
 *
 * Session 4 (CallPanel port) — `CallPanel`'s desktop overflow changed from
 * `lg:overflow-y-auto` to `lg:overflow-hidden`. That scaffold-era setting
 * assumed unstyled content that just grew past the panel; now that
 * `CallControls` docks to the bottom of the joined-call state (see
 * `CallOverlay.tsx`), the panel itself needs a bounded height so that
 * dock can pin in place while `ParticipantGrid` scrolls internally
 * instead of the whole column scrolling underneath it.
 */
function LayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const room_id = params.room_id as string;
  const { setRightMobileMenu } = useUIStore();

  return (
    <RoomCallProvider roomId={room_id}>
      <section className="flex h-[100dvh] overflow-hidden">
        <LeftSidebar className="w-64 flex-shrink-0" />
        <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-w-0">
          <CallPanel
            room_id={room_id}
            className="w-full shrink-0 border-b lg:border-b-0 lg:border-r lg:w-80 lg:h-full lg:overflow-hidden"
          />
          <div className="flex-1 flex flex-col min-w-0 bg-theme-surface">
            <div className="flex-1 overflow-hidden relative">
              {children}
              <button
                onClick={() => setRightMobileMenu(true)}
                className="lg:hidden absolute top-3 right-3 z-40 w-9 h-9 flex items-center justify-center rounded-full bg-theme-surface border border-theme-border text-gray-300"
              >
                <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" />
              </button>
            </div>
          </div>
          <ChatPanel room_id={room_id} className="lg:w-80 lg:flex-shrink-0 lg:border-l" />
        </div>
      </section>
    </RoomCallProvider>
  );
}

export default function RoomLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LayoutContent>{children}</LayoutContent>;
}
