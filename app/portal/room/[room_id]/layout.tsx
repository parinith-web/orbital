"use client";

import { useParams } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import LeftSidebar from "@/components/layout/LeftSidebar";
import { GameRoomSidePanel } from "@/components/features/rooms/GameRoomSidePanel";
import { RoomCallProvider } from "@/contexts/CallContext";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon } from "@hugeicons/core-free-icons";

/**
 * H7.2 — repurposed per the plan's H7 spec: the game (`GameStage`, H7.1,
 * mounted by `page.tsx`) is the center-stage content now, with
 * `GameRoomSidePanel` (chat + call, permanently docked / a mobile drawer)
 * standing in for what used to be three separate pieces of chat-app
 * chrome — `TopBar` (search + info/media/calls tab toggle), `RightSidebar`
 * (member list), and `DetailsSidebar` + its tab children, toggled via
 * `TopBar`'s buttons and shown/hidden via `isSidebarOpen`. None of those
 * three are imported here anymore, but none were deleted either — see
 * `GameRoomSidePanel.tsx`'s header comment for why (they're not reused,
 * just left as orphaned files for a later cleanup pass, matching this
 * codebase's own established "leave low-risk dead code, flag it" pattern
 * from H4). The old full-screen `CallOverlay` is gone too, replaced by
 * its H7.2-docked form living inside `GameRoomSidePanel`.
 *
 * The mobile toggle button below (`rightMobileMenu`) is the only new bit
 * of chrome this session adds to this file — everywhere else, `TopBar`'s
 * "Room Members" button used to flip that same flag; now that `TopBar`
 * isn't part of this route, this button takes over that one job.
 */
function LayoutContent({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const room_id = params.room_id as string;
  const { setRightMobileMenu } = useUIStore();

  return (
    <RoomCallProvider roomId={room_id}>
      <section className="flex h-[100dvh] overflow-hidden">
        <div className="flex-1 flex">
          <LeftSidebar className="w-64 flex-shrink-0" />
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
          <GameRoomSidePanel room_id={room_id} />
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
