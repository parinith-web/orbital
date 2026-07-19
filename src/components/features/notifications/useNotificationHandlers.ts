"use client";
import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useCallSessionActions, useNotificationActions } from "@/hooks";
import { useUserStore } from "@/store/useUserStore";
import { useNotifications } from "@/hooks"; // for type

type NotificationItem = ReturnType<
  typeof useNotifications
>["notifications"][number];

export function useNotificationHandlers() {
  const router = useRouter();
  const { setSidebarOpen, setSidebarTab } = useUIStore();
  const { joinOrSwitchSession } = useCallSessionActions();
  const { markNotificationRead } = useNotificationActions();
  const user = useUserStore((state) => state.user);

  const openNotification = useCallback(
    async (notification: NotificationItem, onAfterOpen?: () => void) => {
      try {
        await markNotificationRead(notification.id);
      } catch (error) {
        console.error(error);
      }

      if (notification.sourceType === "direct") {
        router.push(`/portal/friend/${notification.sourceId}`);
      } else {
        router.push(`/portal/room/${notification.sourceId}`);
      }
      if (notification.notificationType === "call") {
        setSidebarOpen(true);
        setSidebarTab("calls");
      }
      if (onAfterOpen) onAfterOpen();
    },
    [markNotificationRead, router, setSidebarOpen, setSidebarTab],
  );

  const joinNotificationCall = useCallback(
    async (notification: NotificationItem) => {
      if (
        !notification.callId ||
        notification.callStatus !== "active" ||
        !user
      ) {
        return;
      }
      await openNotification(notification);
      await joinOrSwitchSession({
        callId: notification.callId,
        room: {
          id: notification.conversationId,
          name: notification.sourceName,
        },
        userId: user.user_id,
      });
    },
    [openNotification, joinOrSwitchSession, user],
  );

  return { openNotification, joinNotificationCall } as const;
}
