"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useFriendsQuery, UseFriendsResult } from "@/hooks/useFriends";

const FriendsContext = createContext<UseFriendsResult | undefined>(undefined);

export function FriendsProvider({ children }: { children: ReactNode }) {
  const friendsData = useFriendsQuery();

  return (
    <FriendsContext.Provider value={friendsData}>
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriendsContext() {
  const context = useContext(FriendsContext);
  if (context === undefined) {
    throw new Error("useFriendsContext must be used within a FriendsProvider");
  }
  return context;
}
