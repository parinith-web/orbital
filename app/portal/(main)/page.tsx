"use client";
import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import FriendsTab from "@/components/features/friends/FriendsTab";
import { useCurrentUser } from "@/hooks";

export default function Page() {
  const setUser = useUserStore((s) => s.setUser);
  const { user: profile } = useCurrentUser();

  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile, setUser]);

  return <FriendsTab />;
}
