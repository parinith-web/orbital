"use client";

import { createContext, useContext, useMemo } from "react";
import { useUserRooms } from "@/hooks";
import type { UserRoom } from "@/lib/types/room";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface RoomsContextType {
  rooms: UserRoom[];
  membersCount: Record<string, number>;
  activeCallRoomIds: Set<string>;
  isLoading: boolean;
  refreshRooms: () => void;
}

const RoomsContext = createContext<RoomsContextType | undefined>(undefined);

export function RoomsProvider({
  children,
  user_id,
}: {
  children: React.ReactNode;
  user_id: string | null;
}) {
  const { rooms: userRooms, isLoading: roomsLoading } = useUserRooms(user_id);
  const allActiveCalls = useQuery(api.calls.listAllActiveCalls, {});

  const { rooms, membersCount, activeCallRoomIds, isLoading } = useMemo(() => {
    const activeIds = new Set<string>();
    if (allActiveCalls) {
      allActiveCalls.forEach((call) => activeIds.add(call.roomId));
    }

    if (!userRooms) return { rooms: [], membersCount: {}, activeCallRoomIds: activeIds, isLoading: roomsLoading || allActiveCalls === undefined };

    const countMap: Record<string, number> = {};
    const roomsList = userRooms
      .map((r: UserRoom) => {
        countMap[r.room_id] = r.memberCount;
        return r;
      })
      .sort((a: UserRoom, b: UserRoom) => {
        const timeA = a.joined_at ?? 0;
        const timeB = b.joined_at ?? 0;
        return timeB - timeA;
      });

    return { 
      rooms: roomsList, 
      membersCount: countMap, 
      activeCallRoomIds: activeIds,
      isLoading: roomsLoading || allActiveCalls === undefined 
    };
  }, [userRooms, roomsLoading, allActiveCalls]);

  return (
    <RoomsContext.Provider
      value={{ rooms, membersCount, activeCallRoomIds, isLoading, refreshRooms: () => { } }}
    >
      {children}
    </RoomsContext.Provider>
  );
}

export function useRooms() {
  const context = useContext(RoomsContext);
  if (context === undefined) {
    throw new Error("useRooms must be used within RoomsProvider");
  }
  return context;
}