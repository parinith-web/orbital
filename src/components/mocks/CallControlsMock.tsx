"use client";

import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Mic02Icon,
  Video01Icon,
  CallEnd01Icon,
  ComputerScreenShareIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";
import { cn } from "@/lib/utils";

interface CallControlsMockProps {
  className?: string;
}

export const CallControlsMock = ({ className }: CallControlsMockProps) => {
  return (
    <div className={cn("bg-[#0a0a0a] p-3 rounded-2xl flex items-center gap-3 border border-[#222222]", className)}>
      <Button
        variant="other"
        size={"iconLg"}
        className="rounded-2xl bg-[#1d1d1d]"
      >
        <HugeiconsIcon
          icon={Mic02Icon}
          className="w-5 h-5 bg-[#1d1d1d]"
        />
      </Button>

      <Button
        variant="other"
        size="iconLg"
        className="rounded-2xl bg-[#1d1d1d]"
      >
        <HugeiconsIcon
          icon={Video01Icon}
          className="w-5 h-5 bg-[#1d1d1d]"
        />
      </Button>

      <Button
        variant="other"
        size="iconLg"
        className="rounded-2xl bg-[#1d1d1d]"
      >
        <HugeiconsIcon
          icon={ComputerScreenShareIcon}
          className="w-5 h-5 bg-[#1d1d1d]"
        />
      </Button>

      <Button
        variant="other"
        size="iconLg"
        className="rounded-2xl bg-[#1d1d1d]"
      >
        <HugeiconsIcon icon={Settings02Icon} className="w-5 h-5" />
      </Button>

      <Button
        variant="destructive2"
        size="iconLg"
        className="rounded-2xl"
      >
        <HugeiconsIcon icon={CallEnd01Icon} className="w-5 h-5" />
      </Button>
    </div>
  );
};
