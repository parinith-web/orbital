"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useUIStore } from "@/store/uiStore";
import { useRoomMembers } from "@/hooks";
import TopBar from "@/components/layout/TopBar";
import RightSidebar from "@/components/layout/RightSidebar";
import { DetailsSidebar } from "@/components/features/rooms/sidebar/DetailsSidebar";
import Room from "@/components/features/rooms/RoomChatUI";
import { RoomCallOverlay } from "@/components/features/rooms/call/RoomCallOverlay";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";

/**
 * Session 4 — the plain chat/call room shell, ported from Portal's
 * `app/portal/room/[room_id]/layout.tsx` + `page.tsx` combined into one
 * component. Mounted by `room/[room_id]/layout.tsx` (Session 5) only when
 * the room has no live `gameSessions` row; Anomaly's game rooms keep
 * using the existing `CallPanel | GameStage | ChatPanel` layout untouched.
 *
 * Differences from Portal, both intentional (per the refined plan):
 * - No `LeftSidebar`. A room is a focused, chrome-free chat/call space —
 *   Game Hub / Friends / Rooms / Settings nav stays one level up, outside
 *   `/orbital/room/*`, matching how the existing game-room layout already
 *   has no left nav either.
 * - `RoomChatUI` ("Room") is rendered directly here instead of via
 *   `{children}`/`page.tsx`, since `page.tsx` is intentionally left
 *   untouched (it always renders `GameStage`, which must never mount for
 *   a plain room — see Session 5's branch in `layout.tsx`).
 * - Uses the room-scoped `RoomCallOverlay` (Session 3 fork) instead of
 *   the shared `@/components/features/calls/CallOverlay`, since that
 *   shared file's underlying primitives are also used by Anomaly's
 *   `PublicCallPanel`.
 *
 * `RoomCallProvider` is intentionally NOT wrapped here — it's provided by
 * the parent `layout.tsx` for both the game-room and plain-room branches,
 * same as today.
 *
 * Session 5 — because `page.tsx` never mounts for a plain room (see
 * above), it also never runs its membership guard (redirects a non-member
 * back out of the room). This component carries that exact same guard
 * itself so a plain room is protected identically to how Portal protects
 * every room and to how a game room is still protected by `page.tsx`.
 */
export function PlainRoomLayout({ room_id }: { room_id: string }) {
  const { isSidebarOpen } = useUIStore();
  const router = useRouter();
  const members = useRoomMembers(room_id);
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthLoaded) return;

    if (!userId) {
      router.replace(`/`);
      return;
    }

    if (members !== undefined) {
      const isMember = members.some(
        (m: { user_id: string }) => m.user_id === userId,
      );
      if (!isMember) {
        router.replace("/orbital");
      } else {
        setChecking(false);
      }
    }
  }, [room_id, router, members, userId, isAuthLoaded]);

  if (checking) return <ChatSkeleton />;

  return (
    <section className="flex h-[100dvh] overflow-hidden">
      <div className="flex-1 flex">
        <div className="flex-1 flex flex-col min-w-0 bg-theme-surface">
          <TopBar room_id={room_id} />
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-hidden relative">
              <Room room_id={room_id} />
            </div>
            {isSidebarOpen && <DetailsSidebar id={room_id} type="room" />}
          </div>
          <RoomCallOverlay />
        </div>
        <RightSidebar room_id={room_id} />
      </div>
    </section>
  );
}
