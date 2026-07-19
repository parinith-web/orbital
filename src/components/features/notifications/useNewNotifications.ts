import { useRef } from "react";

/**
 * Hook to track new notifications that arrive in real-time
 * Compares current notifications with previous notifications to identify new ones
 */
export function useNewNotifications() {
  const previousIds = useRef<Set<string>>(new Set());
  
  // Update the previous notification IDs set when new notifications arrive
  const updatePreviousIds = (notificationIds: string[]) => {
    previousIds.current = new Set(notificationIds);
  };
  
  // Get new notifications that are not in the previous set
  const getNewNotifications = (currentNotificationIds: string[]) => {
    return currentNotificationIds.filter(id => !previousIds.current.has(id));
  };

  return {
    updatePreviousIds,
    getNewNotifications,
  };
}