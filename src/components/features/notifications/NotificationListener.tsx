"use client";

import { useNotifications, useNotificationActions } from "@/hooks";
import { useNotificationHandlers } from "./useNotificationHandlers";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";
import { NotificationToast } from "./NotificationToast";
import { useNewNotifications } from "./useNewNotifications";
import { useActiveConversationId } from "@/hooks/useActiveConversationId";
import { usePreferences } from "@/contexts/PreferencesContext";

/**
 * NotificationListener handles incoming real-time notifications by showing toasts
 * and ensuring they are marked as read on the backend.
 */
export default function NotificationListener() {
  const { notifications: convexNotifications, isLoading } = useNotifications();
  const { markConversationNotificationsRead } = useNotificationActions();
  const { updatePreviousIds, getNewNotifications } = useNewNotifications();
  const activeConversationId = useActiveConversationId();
  const { mentionSound } = usePreferences();
  const isFirstRun = useRef(true);

  const notifications = useMemo(
    () => convexNotifications || [],
    [convexNotifications],
  );

  const { openNotification, joinNotificationCall } = useNotificationHandlers();

  useEffect(() => {
    if (!activeConversationId || isLoading || notifications.length === 0) {
      return;
    }

    const hasUnreadInActiveConversation = notifications.some(
      (notification) =>
        !notification.isRead &&
        notification.conversationId === activeConversationId,
    );

    if (!hasUnreadInActiveConversation) {
      return;
    }

    void markConversationNotificationsRead(activeConversationId).catch(
      (error) => {
        console.error(error);
      },
    );
  }, [
    activeConversationId,
    isLoading,
    notifications,
    markConversationNotificationsRead,
  ]);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Process notifications to show toasts for new ones
    const notificationIds = notifications.map((n) => n.id);
    if (isFirstRun.current) {
      updatePreviousIds(notificationIds);
      isFirstRun.current = false;
      return;
    }
    const newNotificationIds = getNewNotifications(notificationIds);

    // Mark all current notifications as "seen" to prevent duplicate toasts
    updatePreviousIds(notificationIds);

    // Show toasts for any new notifications that aren't historical
    if (newNotificationIds.length > 0) {
      newNotificationIds.forEach((id) => {
        // Find the full notification object
        const notification = notifications.find((n) => n.id === id);
        if (!notification) return;

        // Don't show toasts if:
        // 1. User is not viewing the conversation that the notification is from
        // 2. User is in the app (tab is focused)
        if (document.visibilityState !== "visible" || document.hidden) {
          return;
        }

        // Don't show toast if user is currently viewing the conversation or it's already read
        if (
          (activeConversationId &&
            activeConversationId === notification.conversationId) ||
          notification.isRead
        ) {
          return;
        }

        // Show the toast
        toast.custom(
          () => (
            <NotificationToast
              item={notification}
              onDismissAndNavigate={() => {
                toast.dismiss(notification.id);
                openNotification(notification);
              }}
              onJoinCall={async (e) => {
                e.stopPropagation();
                toast.dismiss(notification.id);
                await joinNotificationCall(notification);
              }}
            />
          ),
          {
            id: notification.id,
            duration: 4000,
          },
        );

        // Play mention sound if notification has mentions
        // @ts-ignore - hasMentions is added in convex function
        if (notification.hasMentions) {
          const audio = new Audio(mentionSound);
          audio.volume = 0.5;
          audio.play().catch((err) => console.error("Error playing sound:", err));
        }
      });
    }
  }, [
    notifications,
    convexNotifications,
    isLoading,
    openNotification,
    joinNotificationCall,
    activeConversationId,
    updatePreviousIds,
    getNewNotifications,
  ]);

  return null;
}
