"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback } from "react";
import type { Id } from "@/convex/_generated/dataModel";

export interface UnreadCounterItem {
  conversationId: string;
  sourceType: "room" | "direct";
  sourceId: string;
  unreadCount: number;
  updatedAt: number;
  hasUnreadMentions: boolean;
}

export function useNotifications() {
  const notificationsQuery = useQuery(
    api.chatNotifications.getMessageNotifications,
  );

  return {
    notifications: notificationsQuery ?? [],
    isLoading: notificationsQuery === undefined,
  };
}

export function useUnreadCounters() {
  const countersQuery = useQuery(api.chatNotifications.getUnreadCounters);

  return {
    counters: (countersQuery ?? []) as UnreadCounterItem[],
    isLoading: countersQuery === undefined,
  };
}

interface UseNotificationActionsResult {
  removeNotification: (
    notificationId: Id<"chatNotifications">,
  ) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  markNotificationRead: (
    notificationId: Id<"chatNotifications">,
  ) => Promise<void>;
  markConversationNotificationsRead: (conversationId: string) => Promise<void>;
}

export function useNotificationActions(): UseNotificationActionsResult {
  const removeNotificationMutation = useMutation(
    api.chatNotifications.removeNotification,
  );
  const clearAllNotificationsMutation = useMutation(
    api.chatNotifications.clearAllNotifications,
  );
  const markNotificationReadMutation = useMutation(
    api.chatNotifications.markNotificationRead,
  );
  const markConversationNotificationsReadMutation = useMutation(
    api.chatNotifications.markConversationNotificationsRead,
  );

  const removeNotification = useCallback(
    async (notificationId: Id<"chatNotifications">) => {
      await removeNotificationMutation({ notification_id: notificationId });
    },
    [removeNotificationMutation],
  );

  const clearAllNotifications = useCallback(async () => {
    await clearAllNotificationsMutation({});
  }, [clearAllNotificationsMutation]);

  const markNotificationRead = useCallback(
    async (notificationId: Id<"chatNotifications">) => {
      await markNotificationReadMutation({ notification_id: notificationId });
    },
    [markNotificationReadMutation],
  );

  const markConversationNotificationsRead = useCallback(
    async (conversationId: string) => {
      await markConversationNotificationsReadMutation({
        conversation_id: conversationId,
      });
    },
    [markConversationNotificationsReadMutation],
  );

  return {
    removeNotification,
    clearAllNotifications,
    markNotificationRead,
    markConversationNotificationsRead,
  };
}
