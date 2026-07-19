"use client";

import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useCallsQuery, UseCallsResult } from "@/hooks/useCalls";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface RoomCallContextType extends UseCallsResult {
  roomId: string;
  participantProfiles: Record<string, any>;
}

const RoomCallContext = createContext<RoomCallContextType | undefined>(undefined);

export function RoomCallProvider({ children, roomId }: { children: ReactNode; roomId: string }) {
  const callsData = useCallsQuery(roomId);
  const { activeCalls, recentCalls } = callsData;

  // Collect all unique participants from both active and recent calls
  const allParticipantIds = useMemo(() => {
    const ids = new Set<string>();
    activeCalls.forEach(call => call.allParticipants.forEach(p => ids.add(p)));
    recentCalls.forEach(call => call.allParticipants.forEach(p => ids.add(p)));
    return Array.from(ids).sort();
  }, [activeCalls, recentCalls]);

  const profiles = useQuery(api.users.getUsersByExternalIds, { user_ids: allParticipantIds });

  const participantProfiles = useMemo(() => {
    const map: Record<string, any> = {};
    profiles?.forEach(p => {
      map[p.user_id] = p;
    });
    return map;
  }, [profiles]);

  return (
    <RoomCallContext.Provider value={{ ...callsData, roomId, participantProfiles }}>
      {children}
    </RoomCallContext.Provider>
  );
}

export function useRoomCallContext() {
  return useContext(RoomCallContext);
}
