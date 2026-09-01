"use client";

import { memo } from "react";
import { UserAvatar } from "@/components/avatar";

interface UserProfile {
  user_id: string;
  username: string;
  avatar?: string;
}

interface AvatarStackProps {
  users: UserProfile[];
  size?: number;
  showCount?: boolean;
  limit?: number;
}

const AvatarStack = ({
  users,
  limit = 4,
  size = 32,
  showCount = false,
}: AvatarStackProps) => {
  const displayUsers = users.slice(0, limit);
  const remainingCount = users.length > limit ? users.length - limit : 0;

  if (users.length === 0) return null;

  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex -space-x-3 overflow-hidden p-1">
        {displayUsers.map((user, i) => (
          <div
            key={user.user_id}
            className="relative inline-block"
            style={{ zIndex: i }}
            title={user.username}
          >
            <UserAvatar
              avatar={user.avatar}
              alt={user.username}
              size={size}
              className="rounded-full ring-1 ring-theme-base object-cover bg-theme-base overflow-hidden flex items-center justify-center"
            />
          </div>
        ))}
        {remainingCount > 0 && (
          <div
            className="relative flex items-center justify-center rounded-full ring-2 ring-theme-base bg-theme-hover text-white font-bold text-[10px]"
            style={{ width: size, height: size, zIndex: limit + 1 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
      {showCount && (
        <span className="text-xs font-medium text-gray-500 pr-2">
          {users.length} joined
        </span>
      )}
    </div>
  );
};

export default memo(AvatarStack);
