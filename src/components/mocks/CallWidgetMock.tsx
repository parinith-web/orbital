"use client";

import AvatarStack from "@/components/ui/AvatarStack";
import { Mic02Icon, CallEnd01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const CallWidgetMock = ({
  name = "Study",
  className,
}: {
  name?: string;
  className?: string;
}) => (
  <div
    className={`flex justify-between bg-[#272727] items-center rounded-lg px-3 py-2 border border-[#242424] shadow-2xl backdrop-blur-md ${className || "w-60"}`}
  >
    <div className="flex items-center gap-2 text-gray-100 min-w-0">
      <span className="text-sm font-medium truncate max-w-[96px]">{name}</span>
      <div className="flex-1 overflow-hidden">
        <AvatarStack
          users={[
            { user_id: "sq", username: "sq", avatar: "/assets/sq.png" },
            { user_id: "bu", username: "bu", avatar: "/assets/bu.png" },
          ]}
          size={20}
        />
      </div>
    </div>
    <div className="flex items-center gap-2">
      <div className="p-2 rounded-xl bg-white/5 text-gray-300">
        <HugeiconsIcon icon={Mic02Icon} className="w-4 h-4" />
      </div>
      <div className="p-2 rounded-xl bg-red-800 text-red-100">
        <HugeiconsIcon icon={CallEnd01Icon} className="w-4 h-4" />
      </div>
    </div>
  </div>
);
