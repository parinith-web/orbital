"use client";

import Image from "next/image";
import { Tick01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const PendingRequestMock = ({ className }: { className?: string }) => (
  <div
    className={`bg-[#101010] border border-[#242424] p-2 rounded-[8px] h-fit backdrop-blur-md ${className || "w-56"}`}
  >
    <div className="bg-[#0a0a0a] text-sm text-white h-9 rounded-[8px] w-fit p-1 flex items-center gap-1 mb-2">
      <div className="px-3 py-1 rounded-[6px] bg-[#272727] text-xs">
        Received
      </div>
      <div className="px-3 py-1 rounded-[6px] text-xs text-white/40">Sent</div>
    </div>

    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 p-2 rounded-[6px]">
        <Image
          src="/assets/ch.png"
          width={32}
          height={32}
          alt=""
          className="rounded-[6px]"
          style={{ width: "auto", height: "auto" }}
        />
        <div className="flex-1 min-w-0 text-left">
          <div className="text-white text-sm truncate font-medium">Ember</div>
          <div className="text-white/40 text-xs">15m</div>
        </div>
        <div className="flex gap-1">
          <button className="p-1 rounded-[6px]">
            <HugeiconsIcon
              icon={Tick01Icon}
              className="w-4 h-4 text-green-500"
            />
          </button>
          <button className="p-1 rounded-[6px]">
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="w-4 h-4 text-gray-300"
            />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 p-2 rounded-[6px]">
        <Image
          src="/assets/pi.png"
          width={32}
          height={32}
          alt=""
          className="rounded-[6px]"
          style={{ width: "auto", height: "auto" }}
        />
        <div className="flex-1 min-w-0 text-left">
          <div className="text-white text-sm truncate font-medium">Volt</div>
          <div className="text-white/40 text-xs">2hr</div>
        </div>
        <div className="flex gap-1">
          <button className="p-1 rounded-[6px]">
            <HugeiconsIcon
              icon={Tick01Icon}
              className="w-4 h-4 text-green-500"
            />
          </button>
          <button className="p-1 rounded-[6px]">
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="w-4 h-4 text-gray-300"
            />
          </button>
        </div>
      </div>
    </div>
  </div>
);
