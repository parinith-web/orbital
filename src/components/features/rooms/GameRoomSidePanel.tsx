"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserRemove01Icon,
  Menu01Icon,
  Delete02Icon,
  CopyIcon,
  Cancel01Icon,
  CallIcon,
} from "@hugeicons/core-free-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import { useUserStore } from "@/store/useUserStore";
import { useUIStore } from "@/store/uiStore";
import { useCallStore } from "@/store/callStore";
import { useRooms } from "@/contexts/roomContext";
import { useRoomMembers, useCalls, useCallSessionActions } from "@/hooks";
import { RoomAvatar } from "@/components/ui/RoomAvatar";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { Button } from "@/components/ui/button";
import ActiveCallPanel from "./sidebar/sidebar-calls/ActiveCallPanel";
import RecentCallsList from "./sidebar/sidebar-calls/RecentCallsList";
import { CallOverlay } from "@/components/features/calls/CallOverlay";
import RoomChatUI from "./RoomChatUI";

/**
 * H7.2 — the room page's permanently-docked chat/call panel.
 *
 * WHY THIS EXISTS: H7.1's `GameStage` gave the game a permanent, call-
 * independent home center-stage. This is the other half of H7's spec: a
 * right-side panel that stacks (top to bottom) room identity, the call
 * (participant grid + controls when joined, a join/start prompt when not),
 * and chat — docked on desktop, a slide-in drawer on mobile (toggled via
 * `uiStore`'s `rightMobileMenu`, the same field the old chat-app
 * `RightSidebar` used for its own mobile drawer, reused here rather than
 * inventing a second flag for the same visual slot).
 *
 * WHAT THIS REPLACES: the old room layout's `TopBar` (search/media/info/
 * calls tab-toggle header), `RightSidebar` (member list), and
 * `DetailsSidebar` + its `sidebar-info`/`sidebar-media` tab children.
 * None of those files were deleted — see the layout.tsx H7.2 comment for
 * why — but this component does not reuse them; the room page's chrome is
 * this panel now, not a toggled details drawer alongside a chat-filling
 * main pane. `sidebar-calls`'s `ActiveCallPanel`/`RecentCallsList` ARE
 * reused directly (see "not joined" section below) — only their shared
 * `SidebarCalls` wrapper is skipped, because `SidebarCalls` renders inside
 * `SidebarLayout`, which is `fixed md:static ... h-full` — i.e. built to
 * BE an entire standalone panel, not to sit above a fixed-size call area
 * with chat still needing the rest of the column's height below it.
 *
 * CALL SECTION: reuses `CallOverlay` (H7.2-repurposed — see that file's
 * own header comment for why it no longer takes over the full screen) for
 * the "joined" state, since that's where `ParticipantGrid`/`CallControls`/
 * screen-share already live, exactly as the plan calls for reusing them
 * "as-is". For the "not yet joined" state, `ActiveCallPanel`/
 * `RecentCallsList` plus a "Start Call" button are composed directly here
 * (same pieces `SidebarCalls` used, minus its incompatible outer shell).
 *
 * DELIBERATELY NOT PORTED: `SidebarInfo`'s room-rename and per-room
 * notification-preference controls. The plan's H7 spec only calls for
 * chat + call docked alongside the game; rename/notification-prefs aren't
 * part of that and were judged out of scope for this session rather than
 * silently dropped — flagged here for whoever picks up next. Room ID copy
 * and Leave/Delete Room (ported from the old `RightSidebar`'s dropdown,
 * unchanged logic) are kept, since losing the only way to leave a room
 * would be a real regression, not just a trimmed nice-to-have.
 */

function useRoomIdentity(room_id: string) {
  const { rooms, isLoading } = useRooms();
  const room = rooms.find((r) => r.room_id === room_id);
  return { roomName: room?.Rooms?.room_name ?? "", isLoading };
}

function RoomIdentityHeader({
  room_id,
  onMobileClose,
}: {
  room_id: string;
  onMobileClose: () => void;
}) {
  const user = useUserStore((s) => s.user);
  const { roomName, isLoading } = useRoomIdentity(room_id);
  const members = useRoomMembers(room_id);
  const owner = members?.find((m) => m.role === "owner");
  const owner_id = owner?.user_id ?? "";
  const isOwner = owner_id === (user?.user_id ?? "");

  if (!user?.user_id || isLoading || !roomName) {
    return <Skeleton className="h-14 m-2 rounded-[8px]" />;
  }

  return (
    <div className="flex items-center justify-between gap-2 px-3 h-14 border-b border-theme-border shrink-0">
      <div className="flex gap-3 items-center min-w-0">
        <RoomAvatar name={roomName} className="w-9 h-9 shrink-0" />
        <div className="flex flex-col min-w-0">
          <span className="truncate text-sm text-white">{roomName}</span>
          <span className="text-white/40 text-xs truncate">
            ID: {room_id}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
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

        <button
          onClick={onMobileClose}
          className="w-8 h-8 lg:hidden flex items-center justify-center hover:bg-theme-hover rounded-[12px]"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4 text-white/70" />
        </button>
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
      console.error("[GameRoomSidePanel] Failed to start call:", error);
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

export function GameRoomSidePanel({ room_id }: { room_id: string }) {
  const { rightMobileMenu, setRightMobileMenu } = useUIStore();
  const { status: callStatus, actualRoomId } = useCallStore();
  const { roomName } = useRoomIdentity(room_id);

  const isJoinedHere =
    (callStatus === "joined" || callStatus === "joining") &&
    actualRoomId === room_id;

  return (
    <div
      className={`bg-theme-surface flex flex-col h-full overflow-hidden border-theme-border border-l
      text-white select-none
      transition-transform duration-300 ease-in-out
      fixed top-0 right-0 z-[99] w-full max-w-sm
      lg:translate-y-0 translate-y-12
      ${rightMobileMenu ? "translate-x-0" : "translate-x-full"}
      lg:static lg:translate-x-0 lg:w-80 lg:max-w-none`}
    >
      <RoomIdentityHeader
        room_id={room_id}
        onMobileClose={() => setRightMobileMenu(false)}
      />

      <div className="shrink-0 border-b border-theme-border">
        {isJoinedHere ? (
          <CallOverlay />
        ) : (
          <CallJoinSection room_id={room_id} roomName={roomName} />
        )}
      </div>

      <div className="flex-1 min-h-0">
        <RoomChatUI room_id={room_id} />
      </div>
    </div>
  );
}
