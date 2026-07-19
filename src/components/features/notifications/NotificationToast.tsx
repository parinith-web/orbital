"use client";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon, HashtagIcon } from "@hugeicons/core-free-icons";

import type { useNotifications } from "@/hooks";

type NotificationItem = ReturnType<
  typeof useNotifications
>["notifications"][number];

export interface NotificationToastProps {
  item: NotificationItem;
  onDismissAndNavigate: () => void;
  onJoinCall: (e: React.MouseEvent) => Promise<void>;
}

export function NotificationToast({
  item,
  onDismissAndNavigate,
  onJoinCall,
}: NotificationToastProps) {
  return (
    <div
      onClick={onDismissAndNavigate}
      className="cursor-pointer w-[min(72vw,380px)] rounded-[12px] border border-theme-border bg-theme-surface px-4 py-3 text-white shadow-2xl"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-theme-border bg-theme-base">
          {item.senderAvatar ? (
            <Image
              src={item.senderAvatar}
              alt={item.senderName}
              width={40}
              height={40}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <HugeiconsIcon
              icon={Notification01Icon}
              className="h-4 w-4 text-white/65"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-3">
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
              {item.senderName}
            </p>
            {item.sourceType === "room" && (
              <div className="ml-auto flex flex-shrink-0 items-center gap-1.5 text-xs text-white/55">
                <HugeiconsIcon
                  icon={HashtagIcon}
                  className="h-3.5 w-3.5 flex-shrink-0"
                />
                <span className="max-w-[140px] truncate text-sm text-white/75">
                  {item.sourceName}
                </span>
              </div>
            )}
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-white/65">
            {item.message}
          </p>
          <div className="mt-3 flex items-center justify-end gap-2">
            {item.notificationType === "call" &&
              item.callStatus === "active" && (
                <button
                  onClick={onJoinCall}
                  className="rounded-[10px] bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                >
                  Join
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
