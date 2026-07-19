"use client";
import { useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import LeftSidebar from "@/components/layout/LeftSidebar";
import ProfilePage from "@/components/features/profile/ProfilePage/ProfilePage";
import { useCurrentUser } from "@/hooks";

export default function Page() {
  const setUser = useUserStore((s) => s.setUser);
  const { user: profile } = useCurrentUser();

  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile, setUser]);

  return (
    <div className="text-white flex h-screen overflow-hidden">
      <LeftSidebar className="w-64" />
      <div className="flex-1 h-[100dvh]">
        <ProfilePage />
      </div>
    </div>
  );
}
