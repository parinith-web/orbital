"use client";
import { createContext, useContext } from "react";
import { useGlobalPresence } from "@/hooks/useGlobalPresence";

interface PresenceContextValue {
  onlineUsers: Set<string>;
  awayUsers: Set<string>;
  setStatus: (status: "online" | "away") => Promise<void>;
}

const PresenceContext = createContext<PresenceContextValue | null>(null);

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const presence = useGlobalPresence();
  return (
    <PresenceContext.Provider value={presence}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence(): PresenceContextValue {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresence must be used within PresenceProvider");
  return ctx;
}
