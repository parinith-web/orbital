"use client";

import AvatarStack from "@/components/ui/AvatarStack";
import { HashtagIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const CallEndedNotificationMock = ({
  className,
}: {
  className?: string;
}) => (
  <div
    className={`group relative rounded-[14px] p-3 bg-[#101010] border border-[#242424] backdrop-blur-md ${className || "w-72"}`}
  >
    <div className="flex items-center justify-between mb-3">
      <div className="text-sm font-medium text-white/90">Call ended</div>
      <div className="flex items-center gap-1 text-xs text-white/55 text-left">
        <HugeiconsIcon
          icon={HashtagIcon}
          className="h-3.5 w-3.5 flex-shrink-0"
        />
        <span className="max-w-[100px] truncate text-sm text-white/75 text-left">
          study-room
        </span>
      </div>
    </div>
    <AvatarStack
      users={[
        { user_id: "sq", username: "sq", avatar: "/assets/sq.png" },
        { user_id: "ch", username: "ch", avatar: "/assets/ch.png" },
        { user_id: "pi", username: "pi", avatar: "/assets/pi.png" },
      ]}
      size={26}
      limit={5}
    />
    <p className="mt-2 text-xs text-white/35 text-left">1 hour ago</p>
  </div>
);
