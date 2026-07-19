"use client";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CancelCircleIcon,
  Notification01Icon,
  HashtagIcon,
} from "@hugeicons/core-free-icons";
import AvatarStack from "@/components/ui/AvatarStack";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { timeAgo } from "@/lib/utils/date";

import type { useNotifications } from "@/hooks";

type NotificationItem = ReturnType<
  typeof useNotifications
>["notifications"][number];

export function NotificationCard({
  notification,
  participantProfiles = [],
  onOpen,
  onJoin,
  onRemove,
}: {
  notification: NotificationItem;
  participantProfiles?: any[];
  onOpen: () => void;
  onJoin: () => Promise<void>;
  onRemove: () => Promise<void>;
}) {

  const isEndedCall =
    notification.notificationType === "call" &&
    notification.callStatus === "ended";

  return (
    <div
      className={`group relative rounded-[14px] p-3 shadow-sm 
      bg-theme-base`}
    >
      <button
        onClick={async (e) => {
          e.stopPropagation();
          await onRemove();
        }}
        className="absolute -top-0 right-0 z-[60] flex h-4 w-4 items-center justify-center rounded-full border border-white/5 opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:scale-110 group-hover:opacity-100"
        aria-label="Clear notification"
      >
        <HugeiconsIcon
          icon={CancelCircleIcon}
          className="h-4 w-4 text-white/50"
        />
      </button>

      {isEndedCall ? (
        <button onClick={onOpen} className="w-full text-left">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium text-white/90">Call ended</div>
            <div className="flex items-center gap-1 text-xs text-white/55">
              {notification.sourceType === "room" && (
                <HugeiconsIcon
                  icon={HashtagIcon}
                  className="h-3.5 w-3.5 flex-shrink-0"
                />
              )}
              <span className="max-w-[130px] truncate text-sm text-white/75">
                {notification.sourceName}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <AvatarStack users={participantProfiles} size={26} limit={5} />
          </div>
          <p className="mt-2 text-xs text-white/35">
            {timeAgo(notification.createdAt)}
          </p>
        </button>
      ) : (
        <div className="group flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-[12px] border border-theme-border bg-theme-base">
            {notification.senderAvatar ? (
              <Image
                src={notification.senderAvatar}
                alt={notification.senderName}
                width={12}
                height={12}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <HugeiconsIcon
                icon={Notification01Icon}
                className="h-4 w-4 text-white/45"
              />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <button onClick={onOpen} className="w-full text-left">
              <div className="flex min-w-0 items-center gap-3">
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-white/90">
                  {notification.senderName}
                </p>
                {notification.sourceType === "room" && (
                  <div className="ml-auto pr-1 flex flex-shrink-0 items-center gap-1.5 text-xs text-white/55">
                    <HugeiconsIcon
                      icon={HashtagIcon}
                      className="h-3.5 w-3.5 flex-shrink-0"
                    />
                    <span className="max-w-[130px] truncate text-sm text-white/75">
                      {notification.sourceName}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-start gap-3">
                <p className="line-clamp-2 min-w-0 flex-1 text-sm text-white/60">
                  {notification.message}
                </p>
                <p className="ml-auto pr-1 flex-shrink-0 pt-0.5 text-xs text-white/35">
                  {timeAgo(notification.createdAt)}
                </p>
              </div>
            </button>
            {notification.notificationType === "call" &&
              notification.callStatus === "active" && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      await onJoin();
                    }}
                    className="rounded-[10px] bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                  >
                    Join
                  </button>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
