import { useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserRemove01Icon,
  Menu01Icon,
  Delete02Icon,
  CopyIcon,
} from "@hugeicons/core-free-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { useUserStore } from "@/store/useUserStore";
import { toast } from "sonner";
import { usePresence } from "@/contexts/presenceContext";
import { RoomMembersList } from "@/components/features/rooms/RoomMembersList";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { useRooms } from "@/contexts/roomContext";
import { useRoomMembers } from "@/hooks";
import { useUIStore } from "@/store/uiStore";
import { RoomAvatar } from "@/components/ui/RoomAvatar";

function useRoomDetails(roomId: string) {
  const {
    rooms,
    membersCount: allMembersCount,
    isLoading: isRoomsLoading,
  } = useRooms();

  return useMemo(() => {
    const room = rooms.find((r) => r.room_id === roomId);
    const roomName = room?.Rooms?.room_name ?? "";
    const memberCount = room ? (allMembersCount[roomId] ?? 0) : 0;

    return { room, roomName, memberCount, isRoomsLoading };
  }, [rooms, roomId, allMembersCount, isRoomsLoading]);
}

export default function RightSidebar({ room_id }: { room_id: string }) {
  const user = useUserStore((s) => s.user);
  const { rightMobileMenu } = useUIStore();
  const { onlineUsers, awayUsers } = usePresence();

  const { roomName, memberCount, isRoomsLoading } = useRoomDetails(room_id);
  const members = useRoomMembers(room_id);

  const owner = members?.find((m) => m.role === "owner");
  const owner_id = owner?.user_id ?? "";
  const isOwner = owner_id === (user?.user_id ?? "");

  return (
    <>
      <div
        className={`bg-theme-surface px-2 h-screen flex flex-col overflow-hidden border-theme-border border-l
    text-white
    select-none
    transition-transform duration-300 ease-in-out
    fixed top-0 right-0 z-[99] w-70
    lg:translate-y-0 translate-y-12
    ${rightMobileMenu ? "translate-x-0" : "translate-x-full"}

    lg:static lg:translate-x-0`}
      >
        {!user?.user_id || isRoomsLoading || !roomName ? (
          <Skeleton className="h-[56px] mt-2 w-[268px]  rounded-[8px]" />
        ) : (
          <div className="relative w-[268px] flex-none flex items-center justify-between mt-2 rounded-[8px] py-2 px-2">
            <div className="flex gap-3 items-center">
              <RoomAvatar name={roomName} className="w-10 h-10" />
              <div className="flex flex-col rounded-[8px]">
                <span className="truncate max-w-[120px]">{roomName}</span>
                <span className="text-white/40 text-xs">ID: {room_id}</span>
              </div>
            </div>

            <DropdownMenu.Root modal={false}>
              <DropdownMenu.Trigger asChild>
                <div className="w-8 h-8 cursor-pointer flex items-center justify-center hover:bg-theme-hover rounded-[12px]">
                  <HugeiconsIcon
                    icon={Menu01Icon}
                    className="w-4 h-4 text-white/90 hover:text-gray-200 cursor-pointer"
                  />
                </div>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={8}
                  align="end"
                  className="w-auto min-w-[140px] bg-theme-surface border border-theme-border rounded-md  z-[100] animate-in fade-in duration-100 outline-none"
                >
                  <DropdownMenu.Item
                    onClick={() => {
                      navigator.clipboard.writeText(room_id);
                      toast.success("Room ID copied to clipboard");
                    }}
                    className="px-3 py-2.5 text-xs text-gray-300 hover:bg-theme-hover flex items-center rounded-t-sm gap-2 cursor-pointer outline-none"
                  >
                    <HugeiconsIcon icon={CopyIcon} className="w-4 h-4" />
                    Copy Room ID
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onClick={() => {
                      useUIStore.getState().setModal("LEAVE_ROOM", {
                        roomName,
                        owner_id,
                        room_id,
                      });
                    }}
                    className="px-3 py-2.5 text-xs text-red-300 hover:bg-theme-hover flex items-center rounded-b-sm gap-2 cursor-pointer outline-none"
                  >
                    <HugeiconsIcon
                      icon={isOwner ? Delete02Icon : UserRemove01Icon}
                      className="w-4 h-4"
                    />
                    {isOwner ? "Delete Room" : "Leave Room"}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        )}
        {!user?.user_id || !members || members.length === 0 ? (
          <ListSkeleton />
        ) : (
          <RoomMembersList
            members={members}
            memberCount={memberCount}
            onlineUsers={onlineUsers}
            awayUsers={awayUsers}
            user={user}
          />
        )}
      </div>
    </>
  );
}
