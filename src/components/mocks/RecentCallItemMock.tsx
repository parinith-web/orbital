"use client";

import AvatarStack from "@/components/ui/AvatarStack";

export const RecentCallItemMock = ({ className }: { className?: string }) => (
  <div className={`bg-[#101010] border border-[#242424] shadow-2xl backdrop-blur-md rounded-xl overflow-hidden ${className || "w-64"}`}>
    <div className="px-3 py-2 text-xs font-bold text-gray-500 bg-[#0a0a0a]/50 text-left">
      Today
    </div>
    <div className="px-3 py-3 border-b border-[#242424]/30">
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center">
            <AvatarStack
              users={[
                { user_id: "pi", username: "pi", avatar: "/assets/pi.png" },
                { user_id: "ch", username: "ch", avatar: "/assets/ch.png" }
              ]}
              size={24}
              showCount
            />
          </div>
          <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-1">
            12:30 PM <span className="flex items-center gap-1">• 15m</span>
          </div>
        </div>
      </div>
    </div>
    <div className="px-3 py-3">
      <div className="flex items-center gap-3 px-2">
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center">
            <AvatarStack
              users={[
                { user_id: "sq", username: "sq", avatar: "/assets/sq.png" }
              ]}
              size={24}
              showCount
            />
          </div>
          <div className="text-[10px] text-gray-500 flex items-center gap-2 mt-1">
            10:15 AM <span className="flex items-center gap-1">• 8m</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
