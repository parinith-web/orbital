"use client";

import { RoomAvatar } from "@/components/ui/RoomAvatar";
import { RoomMembersList } from "@/components/features/rooms/RoomMembersList";
import type { RoomMemberWithUser, User } from "@/lib/types";

/**
 * This panel doesn't call Convex — it's the marketing page, no session to
 * query against — so it feeds the real, unmodified `RoomMembersList`
 * component static sample data instead of a live query. Same component,
 * same classNames, same visuals a signed-in user sees in the app's
 * RightSidebar; only the data source differs.
 */

const DEMO_USER: User = { user_id: "demo-self", username: "You" };

const DEMO_MEMBERS: RoomMemberWithUser[] = [
  {
    room_id: "demo-room",
    user_id: "f-wave",
    role: "Owner",
    Users: { user_id: "f-wave", username: "Wave", avatar: "/assets/sq.png" },
  },
  {
    room_id: "demo-room",
    user_id: "f-ember",
    role: "Member",
    Users: { user_id: "f-ember", username: "Ember", avatar: "/assets/ch.png" },
  },
  {
    room_id: "demo-room",
    user_id: "f-volt",
    role: "Member",
    Users: { user_id: "f-volt", username: "Volt", avatar: "/assets/pi.png" },
  },
];

const ONLINE_USERS = new Set(["f-wave", "f-ember", "f-volt"]);

export function AppUIRooms({ className }: { className?: string }) {
  return (
    <div className={`flex w-full flex-col items-center gap-1 ${className || ""}`}>
      <div className="flex flex-col gap-1 w-full sm:w-[268px]">
        <span className="text-left text-[11px] uppercase tracking-wide text-white/40 px-1 pb-1">
          Rooms
        </span>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-theme-surface">
          <RoomAvatar name="Projects" className="w-10 h-10 flex-none" />
          <div className="flex-1 min-w-0 flex flex-col text-left">
            <span className="truncate text-white/90">Projects</span>
            <span className="text-xs text-gray-400">ID: 4369</span>
          </div>
        </div>

        {/* w-[268px] matches the width RoomMembersList is built for in the
            app's RightSidebar (w-70 minus its px-2 padding) — its own
            "Members" header row relies on that width, so we reproduce the
            container rather than the component's internal spacing. */}
        <div className="w-[268px] max-w-full h-64 overflow-hidden rounded-[8px] bg-theme-surface px-2 py-1 mt-1 flex flex-col">
          <RoomMembersList
            members={DEMO_MEMBERS}
            memberCount={DEMO_MEMBERS.length}
            onlineUsers={ONLINE_USERS}
            awayUsers={new Set()}
            user={DEMO_USER}
          />
        </div>
      </div>
    </div>
  );
}

export default AppUIRooms;
