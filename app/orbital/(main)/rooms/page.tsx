"use client";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  HashtagIcon,
  Menu01Icon,
  Add01Icon,
  CallIcon,
} from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import { useRooms } from "@/contexts/roomContext";
import { RoomAvatar } from "@/components/ui/RoomAvatar";
import { Button } from "@/components/ui";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Session 3 — Rooms tab. Reuses roomContext's `useRooms()` (already
 * populated by RoomsProvider in app/orbital/layout.tsx, same data
 * RightSidebar reads for the in-room member list) so there's no new
 * data-fetching here. Create Room / Join Room open the global
 * `CREATE_ROOM` / `JOIN_ROOM` modals.
 *
 * Session 2 — these now open the plain chat/call room modals
 * (`rooms.createRoom` / `rooms.joinRoom`), decoupled from Anomaly game
 * rooms. The Game Hub tile's Create/Join Room start a game room instead,
 * via the separate `CREATE_GAME_ROOM` / `JOIN_GAME_ROOM` modals.
 */
export default function RoomsPage() {
  const router = useRouter();
  const { setLeftMobileMenu, leftMobileMenu, setModal } = useUIStore();
  const { rooms, membersCount, activeCallRoomIds, isLoading } = useRooms();

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex justify-between w-full md:px-2 px-3 items-center bg-theme-surface border-b border-theme-border py-1 h-12">
        <div className="md:ml-3 flex items-center w-full gap-2 text-white/90">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLeftMobileMenu(!leftMobileMenu);
            }}
            className="flex-none p-1 md:hidden rounded-[8px] transition-colors"
          >
            <HugeiconsIcon
              icon={Menu01Icon}
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${leftMobileMenu ? "rotate-180" : ""}`}
            />
          </button>
          <HugeiconsIcon icon={HashtagIcon} className="w-4 h-4" />
          <h1 className="text-md">Rooms</h1>
        </div>

        <div className="flex-none flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setModal("JOIN_ROOM")}
          >
            <HugeiconsIcon icon={HashtagIcon} className="w-4 h-4" />
            <span className="hidden sm:inline">Join</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1.5"
            onClick={() => setModal("CREATE_ROOM")}
          >
            <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
            <span className="hidden sm:inline">Create Room</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <ListSkeleton />
        ) : rooms.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <HugeiconsIcon icon={HashtagIcon} className="w-10 h-10 opacity-40" />
            <p className="text-sm">You haven't joined any rooms yet.</p>
            <div className="flex gap-2 mt-2">
              <Button variant="secondary" size="sm" onClick={() => setModal("JOIN_ROOM")}>
                Join Room
              </Button>
              <Button variant="primary" size="sm" onClick={() => setModal("CREATE_ROOM")}>
                Create Room
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-1 max-w-xl mx-auto">
            {rooms.map((room) => {
              const roomName = room.Rooms?.room_name ?? "Unnamed room";
              const memberCount = membersCount[room.room_id] ?? room.memberCount ?? 0;
              const hasActiveCall = activeCallRoomIds.has(room.room_id);

              return (
                <button
                  key={room.room_id}
                  onClick={() => router.push(ROUTES.ORBITAL_ROOM(room.room_id))}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-left bg-theme-surface hover:bg-theme-hover transition-colors duration-200"
                >
                  <RoomAvatar name={roomName} className="w-10 h-10 flex-none" />
                  <div className="flex-1 min-w-0 flex flex-col">
                    <span className="truncate text-white/90">{roomName}</span>
                    <span className="text-xs text-gray-400">
                      {memberCount} {memberCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                  {hasActiveCall && (
                    <div className="flex-none flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
                      <HugeiconsIcon icon={CallIcon} className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Live</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
