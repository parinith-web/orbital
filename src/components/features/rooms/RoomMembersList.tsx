import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserIcon } from "@hugeicons/core-free-icons";
import type { User } from "@/lib/types";
import type { RoomMemberWithUser } from "@/lib/types";
import { UserProfilePopup } from "@/components/popups/UserProfilePopup";

import { StatusIndicator } from "@/components/ui/StatusIndicator";

function getMemberAvatar(
  member: RoomMemberWithUser,
  currentUser: User | null,
): string {
  const isCurrentUser = member?.Users?.user_id === currentUser?.user_id;
  if (isCurrentUser) {
    return currentUser?.avatar ?? "/assets/defaultAvatar.png";
  }
  return member?.Users?.avatar ?? "/assets/defaultAvatar.png";
}

function getMemberDisplayName(
  member: RoomMemberWithUser,
  currentUser: User | null,
): string {
  const isCurrentUser = member?.Users?.user_id === currentUser?.user_id;
  if (isCurrentUser) {
    return currentUser?.username || "";
  }
  return member?.Users?.username || "";
}

interface RoomMembersListProps {
  members: RoomMemberWithUser[];
  memberCount: number;
  onlineUsers: Set<string>;
  awayUsers: Set<string>;
  user: User | null;
}

export const RoomMembersList = ({
  members,
  memberCount,
  onlineUsers,
  awayUsers,
  user,
}: RoomMembersListProps) => {
  return (
    <div className="mt-3 flex flex-col flex-1 min-h-0">
      <div className="flex items-center gap-40">
        <span className="text-xs ml-2 text-[#aaaaaa]">Members</span>
        <div className="bg-theme-hover rounded-[8px] px-2 py-1 flex text-white/60 text-[10px] items-center gap-0.5">
          <HugeiconsIcon icon={UserIcon} className="w-3 h-3 cursor-pointer" />
          {memberCount}
        </div>
      </div>

      <div className="overflow-y-auto h-full mt-2 pb-20">
        {members?.map((member) => {
          const isUserOnline = onlineUsers.has(member.user_id.toString());
          const isUserAway = awayUsers.has(member.user_id.toString());
          const avatar = getMemberAvatar(member, user);
          const displayName = getMemberDisplayName(member, user);

          const isCurrentUser = member?.Users?.user_id === user?.user_id;

          return (
            <div className="text-sm ml-2 mb-1" key={member.user_id}>
              <UserProfilePopup
                user={{
                  id: member?.Users?.user_id || "",
                  username: displayName,
                  avatarUrl: member?.Users?.avatar,
                  joinedAt: member?.Users?._creationTime
                    ? new Date(member.Users._creationTime).toISOString()
                    : new Date().toISOString(),
                }}
                currentUserId={user?.user_id}
                side="left"
                align="start"
              >
                <div
                  className={`flex gap-4 items-center p-1 px-2 -ml-2 rounded-lg transition-colors ${!isCurrentUser ? "hover:bg-theme-border cursor-pointer group" : ""}`}
                >
                  <div className="relative">
                    <Image
                      src={avatar}
                      alt="Avatar"
                      width={30}
                      height={30}
                      unoptimized
                      className="w-10 h-10 rounded-[12px]"
                    />
                    <StatusIndicator
                      isOnline={isUserOnline}
                      isAway={isUserAway}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`truncate max-w-[150px] ${!isCurrentUser ? "group-hover:text-gray-100" : ""}`}
                    >
                      {displayName}
                    </span>
                    {member.role && (
                      <span className="text-[#aaaaaa] font-extralight">
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              </UserProfilePopup>
            </div>
          );
        })}
      </div>
    </div>
  );
};
