"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserRemove01Icon,
  Menu01Icon,
  Delete02Icon,
  CopyIcon,
  CallIcon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { useUserStore } from "@/store/useUserStore";
import { useUIStore } from "@/store/uiStore";
import { useCallStore } from "@/store/callStore";
import { useRooms } from "@/contexts/roomContext";
import {
  useRoomMembers,
  useRoomMemberCount,
  useCalls,
  useCallSessionActions,
} from "@/hooks";
import { RoomAvatar } from "@/components/ui/RoomAvatar";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { Button } from "@/components/ui/button";
import ActiveCallPanel from "./sidebar/sidebar-calls/ActiveCallPanel";
import RecentCallsList from "./sidebar/sidebar-calls/RecentCallsList";
import { CallOverlay } from "@/components/features/calls/CallOverlay";

/**
 * Session 3 (layout restructure scaffold) — left column of the new
 * 3-column room layout (`CallPanel | GameStage | ChatPanel`, mirroring the
 * Anomaly mockup's `CallPanel / GameStage / ChatPanel` order).
 *
 * `GameRoomSidePanel.tsx` — the single combined call+chat panel this
 * replaces — was kept in place unrouted through Session 5 as a rollback
 * reference; Session 6 confirmed `CallPanel` + `ChatPanel` have full
 * parity with it and retired (deleted) it.
 *
 * Unlike the old panel, this renders inline in the page flow on mobile
 * (full-width, stacked above `GameStage`) rather than behind a slide-in
 * drawer — only `ChatPanel` keeps the drawer treatment now. See the room
 * layout.tsx header comment for the reasoning.
 *
 * Session 4 (CallPanel port) — did the visual restyling this file's
 * Session-3 comment deferred: `RoomIdentityHeader` is now a compact,
 * tracked-wide lobby strip (member count added, mirroring the mockup's
 * player-count badge) and the joined-call state (`CallOverlay`) is no
 * longer wrapped in a `shrink-0` box — it's rendered directly as
 * `RoomIdentityHeader`'s flex sibling so it can grow to fill the rest of
 * the column (see `CallOverlay.tsx` for the PlayerTile-grid + docked-
 * controls restyle inside it). The not-joined state (`CallJoinSection` —
 * `ActiveCallPanel`/`RecentCallsList`/"Start Call") is deliberately left
 * as-is per the plan; it keeps its own `shrink-0` wrapper.
 */

function useRoomIdentity(room_id: string) {
  const { rooms, isLoading } = useRooms();
  const room = rooms.find((r) => r.room_id === room_id);
  return { roomName: room?.Rooms?.room_name ?? "", isLoading };
}

function RoomIdentityHeader({ room_id }: { room_id: string }) {
  const user = useUserStore((s) => s.user);
  const { roomName, isLoading } = useRoomIdentity(room_id);
  const members = useRoomMembers(room_id);
  const memberCount = useRoomMemberCount(room_id);
  const owner = members?.find((m) => m.role === "owner");
  const owner_id = owner?.user_id ?? "";
  const isOwner = owner_id === (user?.user_id ?? "");

  if (!user?.user_id || isLoading || !roomName) {
    return <Skeleton className="h-14 m-2 rounded-[8px]" />;
  }

  return (
    <div className="flex items-center justify-between gap-2 px-4 h-14 border-b border-theme-border shrink-0">
      <div className="flex gap-3 items-center min-w-0">
        <RoomAvatar name={roomName} className="w-8 h-8 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="truncate text-xs font-semibold tracking-wide text-white">
            {roomName}
          </span>
          <span className="text-white/40 text-[10px] truncate">
            ID: {room_id}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {typeof memberCount === "number" && (
          <span className="text-[10px] font-normal text-gray-500 tracking-wide whitespace-nowrap">
            {memberCount} {memberCount === 1 ? "MEMBER" : "MEMBERS"}
          </span>
        )}
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger asChild>
            <button className="w-8 h-8 cursor-pointer flex items-center justify-center hover:bg-theme-hover rounded-[12px]">
              <HugeiconsIcon
                icon={Menu01Icon}
                className="w-4 h-4 text-white/90 hover:text-gray-200 cursor-pointer"
              />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={8}
              align="end"
              className="w-auto min-w-[140px] bg-theme-surface border border-theme-border rounded-md z-[100] animate-in fade-in duration-100 outline-none"
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
    </div>
  );
}

/** "Not joined (to this room's call) yet" state — start/join affordance. */
function CallJoinSection({
  room_id,
  roomName,
}: {
  room_id: string;
  roomName: string;
}) {
  const { activeCalls, recentCalls, isLoading } = useCalls(room_id);
  const setActiveCall = useUIStore((s) => s.setActiveCall);
  const { error: callError, clearError } = useCallStore();
  const { startOrSwitchSession } = useCallSessionActions();
  const user = useUserStore((s) => s.user);

  const endedCalls = recentCalls.filter((c) => !c.isActive);
  const userInAnyCall =
    user && activeCalls.some((c) => c.participants.includes(user.user_id));
  const hasNoCalls = activeCalls.length === 0 && endedCalls.length === 0;

  const handleStartNewCall = async () => {
    try {
      await startOrSwitchSession({
        roomId: room_id,
        roomName,
        userId: user?.user_id || "",
      });
    } catch (error) {
      console.error("[CallPanel] Failed to start call:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-3">
        <Skeleton className="w-full h-20 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-h-72 overflow-y-auto">
      {callError && (
        <div className="relative">
          <div className="p-2 text-xs bg-red-500/5 text-red-300 text-center">
            {callError}
          </div>
          <button
            onClick={clearError}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-red-300"
            title="Clear Error"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {hasNoCalls ? (
        <div className="flex flex-col items-center justify-center py-6 text-gray-400">
          <p className="text-sm">No call yet</p>
        </div>
      ) : (
        <>
          {activeCalls.map((call) => (
            <ActiveCallPanel
              key={call._id}
              call={call}
              conversationName={roomName}
              onLeave={() => setActiveCall(null)}
            />
          ))}
          <RecentCallsList calls={endedCalls} />
        </>
      )}

      {!userInAnyCall && (
        <div className="p-3">
          <Button variant="other" onClick={handleStartNewCall} className="w-full">
            <HugeiconsIcon icon={CallIcon} className="w-4 h-4 mr-2" />
            Start Call
          </Button>
        </div>
      )}
    </div>
  );
}

export function CallPanel({
  room_id,
  className = "",
}: {
  room_id: string;
  className?: string;
}) {
  const { status: callStatus, actualRoomId } = useCallStore();
  const { roomName } = useRoomIdentity(room_id);

  const isJoinedHere =
    (callStatus === "joined" || callStatus === "joining") &&
    actualRoomId === room_id;

  return (
    <div
      className={`bg-theme-surface flex flex-col overflow-hidden border-theme-border text-white select-none ${className}`}
    >
      <RoomIdentityHeader room_id={room_id} />

      {isJoinedHere ? (
        <CallOverlay />
      ) : (
        <div className="shrink-0">
          <CallJoinSection room_id={room_id} roomName={roomName} />
        </div>
      )}
    </div>
  );
}
