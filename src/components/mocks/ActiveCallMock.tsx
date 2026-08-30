import AvatarStack from "../ui/AvatarStack";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CallEnd01Icon,
  MicOff02Icon,
  FullscreenIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "../ui";

const isMuted = false;

export const ActiveCallMock = ({ className }: { className?: string }) => (
  <div className={`flex flex-col w-full max-w-[400px] ${className}`}>
    <div className="flex items-center justify-between mb-3 ">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <span className="text-sm font-medium text-white">Active Call</span>
      </div>
      <span className="text-xs text-gray-400">24m</span>
    </div>

    <div className="flex items-center mb-3">
      <AvatarStack
        users={[
          { user_id: "pi", username: "pi", avatar: "/assets/pi.png" },
          { user_id: "bu", username: "bu", avatar: "/assets/bu.png" },
        ]}
        size={24}
        showCount
      />
    </div>

    <div className="flex gap-2 w-full">
      <Button
        variant="other"
        size="md"
        className={`cursor-default pointer-events-none  flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-colors ${
          isMuted ? "bg-red-500/20 text-red-400" : "bg-[#272727] text-white"
        }`}
      >
        <HugeiconsIcon icon={FullscreenIcon} className="w-4 h-4" />
        <span className="text-sm">{"Open"}</span>
      </Button>
      <Button
        variant="destructive2"
        size="md"
        className="cursor-default pointer-events-none flex-1 flex items-center justify-center gap-2 "
      >
        <HugeiconsIcon icon={CallEnd01Icon} className="w-4 h-4" />
        <span className="text-sm">Leave</span>
      </Button>
    </div>
  </div>
);
