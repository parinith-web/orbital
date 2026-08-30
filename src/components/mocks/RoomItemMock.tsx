"use client";
import { RoomAvatar } from "@/components/ui/RoomAvatar";

export const RoomItemMock = ({
  name = "Orbital",
  id = "4567",
  className,
  isActive = false,
}: {
  name?: string;
  id?: string;
  className?: string;
  isActive?: boolean;
}) => (
  <div
    className={`cursor-default min-w-[190px] relative flex items-center gap-3 rounded-[8px] py-2 px-2 bg-[#272727] ${
      isActive ? "bg-theme-hover" : ""
    } ${className}`}
  >
    <div className="relative flex-shrink-0">
      <RoomAvatar name={name} className="w-10 h-10" />
    </div>

    <div className="flex items-center flex-1 min-w-0">
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="truncate max-w-[100px] text-white text-sm">
            {name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#aaaaaa] text-[10px] truncate max-w-[150px]">
            ID: {id}
          </span>
        </div>
      </div>
    </div>
  </div>
);
