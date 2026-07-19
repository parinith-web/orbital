"use client";
import { useState, useMemo } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";

import { usePathname } from "next/navigation";

import { useNotifications, useNotificationActions, useFriends } from "@/hooks";
import { useRooms } from "@/contexts/roomContext";
import { Skeleton } from "@/components/skeletons/Skeleton";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import { useNotificationHandlers } from "./useNotificationHandlers";
import { NotificationCard } from "./NotificationCard";

export default function NotificationTab() {
  const { notificationMenu, setNotificationMenu } = useUIStore();

  const pathname = usePathname();

  const {
    notifications,
    isLoading: isNotificationsLoading,
  } = useNotifications();
  const {
    removeNotification: removeNotificationAction,
    clearAllNotifications: clearAllNotificationsAction,
  } = useNotificationActions();
  const { rooms } = useRooms();
  const { friends } = useFriends();


  const isLoading = isNotificationsLoading && notifications.length === 0;

  const { openNotification, joinNotificationCall } = useNotificationHandlers();

  const allParticipantIds = useMemo(() => {
    const ids = new Set<string>();
    notifications.forEach((n) => {
      if (n.notificationType === "call" && n.participantIds) {
        n.participantIds.forEach((id) => ids.add(id));
      }
    });
    return Array.from(ids).sort();
  }, [notifications]);

  const participantProfiles = useQuery(api.users.getUsersByExternalIds, {
    user_ids: allParticipantIds,
  });

  const profilesMap = useMemo(() => {
    const map = new Map<string, any>();
    participantProfiles?.forEach((p) => map.set(p.user_id, p));
    return map;
  }, [participantProfiles]);

  return (
    <>
      <div
        className={`md:w-[360px] w-[300px] select-none
    transition-transform duration-300 ease-in-out
    h-screen
    fixed top-0 right-0 z-[9000]
    lg:translate-y-0 translate-y-12
    ${notificationMenu ? "translate-x-0" : "translate-x-full"}

    lg:static lg:translate-x-0 border-theme-border border-l bg-theme-surface`}
      >
        <div className="flex justify-between px-2 items-center bg-theme-surface border-b border-theme-border py-1 h-12">
          <div className="ml-3 md:flex hidden items-center gap-2 text-white/90">
            <HugeiconsIcon icon={Notification01Icon} className="w-4 h-4" />
            <h1 className="text-md">Notifications</h1>
          </div>
          <div className="ml-3 md:hidden flex items-center gap-2 text-white/90">
            <h1 className="text-md font-semibold mt-1">Notifications</h1>
          </div>

          <div className="flex items-center text-sm gap-1">
            <button
              onClick={async () => {
                try {
                  await clearAllNotificationsAction();
                } catch (error) {
                  console.error(error);
                }
              }}
              className={`${notifications.length > 0 ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} flex items-center gap-2 h-[28px] hover:bg-theme-hover text-white/90 px-3 py-1 rounded-[8px]`}
            >
              <span className="text-xs text-white/70">Clear</span>
            </button>
          </div>
        </div>

        <div className="mt-2 flex h-[calc(100vh-72px)] flex-col gap-1 overflow-y-auto px-2">
          {isLoading ? (
            <>
              <Skeleton className="h-[92px] rounded-[14px]" />
              <Skeleton className="h-[92px] rounded-[14px]" />
              <Skeleton className="h-[92px] rounded-[14px]" />
            </>
          ) : notifications.length === 0 ? (
            <div className="rounded-[14px] text-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] border border-theme-border bg-theme-base">
                <HugeiconsIcon icon={Notification01Icon} className="h-5 w-5 text-gray-400" />
              </div>
              <p className="mt-4 text-xs text-gray-400">
                No notifications yet
              </p>{" "}
            </div>
          ) : (
            notifications.map((notification) => {
              const profiles = (notification.participantIds || [])
                .map((id) => profilesMap.get(id))
                .filter(Boolean);

              return (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  participantProfiles={profiles}
                  onOpen={() => {
                    void openNotification(notification, () => setNotificationMenu(false));
                  }}
                  onJoin={() => joinNotificationCall(notification)}
                  onRemove={async () => {
                    try {
                      await removeNotificationAction(notification.id);
                    } catch (error) {
                      console.error(error);
                    }
                  }}
                />
              );
            })
          )}
        </div>
      </div>
    </>
  );
}
