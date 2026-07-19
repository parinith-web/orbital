import { useEffect, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

type Status = "online" | "away";

const HEARTBEAT_INTERVAL = 3 * 60 * 1000; // 3 minutes

export function useGlobalPresence() {
  const activePresences = useQuery(api.presence.getOnlineUsers) || [];
  const updatePresence = useMutation(api.presence.update);
  const heartbeatMutation = useMutation(api.presence.heartbeat);
  const goOfflineMutation = useMutation(api.presence.goOffline);

  const { onlineUsers, awayUsers } = useMemo(() => {
    const online = new Set<string>();
    const away = new Set<string>();
    for (const p of activePresences) {
      if (p.status === "online") online.add(p.user_id);
      else if (p.status === "away") away.add(p.user_id);
    }
    return { onlineUsers: online, awayUsers: away };
  }, [activePresences]);

  const setStatus = useCallback(
    async (status: Status) => {
      await updatePresence({ status });
    },
    [updatePresence],
  );

  useEffect(() => {
    // Set online on mount - use async IIFE to ensure initial presence is set before settling
    const initializePresence = async () => {
      await setStatus("online");
    };

    initializePresence();

    // Layer 2: Fallback heartbeat (every 3 min)
    const hbInterval = setInterval(() => {
      heartbeatMutation();
    }, HEARTBEAT_INTERVAL);

    // Away/online on focus/blur
    let awayTimeout: ReturnType<typeof setTimeout>;
    const onFocus = () => {
      clearTimeout(awayTimeout);
      setStatus("online");
    };
    const onBlur = () => {
      awayTimeout = setTimeout(() => setStatus("away"), 5 * 60 * 1000);
    };

    // Layer 1: Instant cleanup on tab close
    const onBeforeUnload = () => {
      goOfflineMutation();
    };

    window.addEventListener("focus", onFocus);
    window.addEventListener("blur", onBlur);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onBeforeUnload);

    return () => {
      clearTimeout(awayTimeout);
      clearInterval(hbInterval);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onBeforeUnload);
    };
  }, [setStatus, heartbeatMutation, goOfflineMutation]);

  return { onlineUsers, awayUsers, setStatus };
}
