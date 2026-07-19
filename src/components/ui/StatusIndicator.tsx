import { HugeiconsIcon } from "@hugeicons/react";
import { Moon02Icon } from "@hugeicons/core-free-icons";

interface StatusIndicatorProps {
  className?: string;
  isOnline: boolean;
  isAway: boolean;
}

export function StatusIndicator({ className,
  isOnline,
  isAway,
}: StatusIndicatorProps) {
  if (isOnline) {
    return (
      <div className={`absolute right-0 bottom-0 w-2 h-2 bg-green-500 rounded-full ${className ?? ''}`} />
    );
  }

  if (isAway) {
    return (
      <HugeiconsIcon
        icon={Moon02Icon}
        fill="currentColor"
        className={`absolute text-yellow-400 right-0 bottom-0 w-[10px] h-[10px] opacity-90 ${className ?? ''}`}
      />
    );
  }

  return (
    <div className={`absolute right-0 bottom-0 w-2 h-2 bg-gray-500 rounded-full ${className ?? ''}`} />
  );
}
