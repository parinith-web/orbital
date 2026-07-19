"use client";

import { useEffect } from "react";
import { useCallStore } from "@/store/callStore";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function CallCleanupListener() {
  const status = useCallStore((state) => state.status);
  const callId = useCallStore((state) => state.callId);
  const leaveCall = useCallStore((state) => state.leaveCall);
  const leaveCallMutation = useMutation(api.calls.leaveCall);

  useEffect(() => {
    const handleUnload = () => {
      if (status === "joined" && callId) {
        void leaveCall();
        void leaveCallMutation({ callId });
      }
    };

    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, [callId, status, leaveCall, leaveCallMutation]);

  return null;
}
