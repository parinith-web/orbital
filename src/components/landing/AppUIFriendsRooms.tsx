"use client";

import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { BubbleChatIcon, UserMinus01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { RoomAvatar } from "@/components/ui/RoomAvatar";
import { UserProfilePopup } from "@/components/popups/UserProfilePopup";
import { RoomMembersList } from "@/components/features/rooms/RoomMembersList";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { formatDateFull } from "@/lib/utils/date";
import type { RoomMemberWithUser, User } from "@/lib/types";

/**
 * This panel doesn't call Convex — it's the marketing page, no session to
 * query against — so it feeds the real, unmodified `RoomMembersList`
 * component (and the same row markup `FriendsListView` renders per friend)
 * static sample data instead of a live query. Same components, same
 * classNames, same visuals a signed-in user sees in the app; only the data
 * source differs.
 */

const DEMO_USER: User = { user_id: "demo-self", username: "You" };

const DEMO_FRIENDS = [
  {
    friend: { user_id: "f-wave", username: "Wave", avatar: "/assets/sq.png" },
    since: Date.UTC(2026, 1, 14),
  },
  {
    friend: { user_id: "f-volt", username: "Volt", avatar: "/assets/pi.png" },
    since: Date.UTC(2026, 4, 2),
  },
];

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

export function AppUIFriendsRooms({ className }: { className?: string }) {
  return (
    <div className={`flex w-full flex-col gap-4 sm:flex-row sm:items-start sm:justify-center ${className || ""}`}>
      {/* Friends — identical row markup to FriendsListView, static data */}
      <div className="flex flex-col gap-1 w-full sm:w-[268px]">
        <span className="text-left text-[11px] uppercase tracking-wide text-white/40 px-1 pb-1">
          Friends
        </span>
        {DEMO_FRIENDS.map(({ friend, since }) => (
          <div
            key={friend.user_id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-theme-surface"
          >
            <UserProfilePopup
              user={{ id: friend.user_id, username: friend.username, avatarUrl: friend.avatar }}
              currentUserId={DEMO_USER.user_id}
              side="right"
              align="start"
            >
              <button className="flex items-center gap-3 min-w-0 flex-1 text-left">
                <Image
                  src={getAvatarUrl(friend.avatar)}
                  alt={friend.username}
                  width={36}
                  height={36}
                  unoptimized
                  className="w-9 h-9 rounded-[10px] flex-none object-cover"
                />
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="truncate text-white/90">{friend.username}</span>
                  <span className="truncate text-xs text-gray-400">
                    Friends since {formatDateFull(since)}
                  </span>
                </div>
              </button>
            </UserProfilePopup>
            <div className="flex-none flex items-center gap-2">
              <Button variant="secondary" size="iconSm" tooltip="Message">
                <HugeiconsIcon icon={BubbleChatIcon} className="w-4 h-4" />
              </Button>
              <Button variant="destructive2" size="iconSm" tooltip="Remove friend">
                <HugeiconsIcon icon={UserMinus01Icon} className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Rooms — identical row markup to the Rooms tab, plus the real,
          unmodified RoomMembersList component rendering a demo room. The
          w-[268px] wrapper matches the width RoomMembersList is built for
          in the app's RightSidebar (w-70 minus its px-2 padding) — its
          own "Members" header row relies on that width, so we reproduce
          the container rather than the component's internal spacing. */}
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

export default AppUIFriendsRooms;
