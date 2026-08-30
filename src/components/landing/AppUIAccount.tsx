"use client";

import { ProfileButton } from "@/components/features/profile/ProfileButton";
import { PreferencesTab } from "@/components/features/profile/ProfilePage/PreferencesTab";
import type { User } from "@/lib/types";

const DEMO_USER: User = {
  user_id: "demo_9f1c2a7e8b3d",
  username: "Ember",
  avatar: "/assets/ch.png",
};

/**
 * `PreferencesTab` — the real Settings > Preferences tab — only touches
 * `ColorContext`/`PreferencesContext`, both already provided app-wide
 * (including on this landing page), so it mounts and works exactly like
 * it does signed in: the accent-color picker genuinely re-themes the
 * page. There's no real two-factor/session/export screen in the app
 * today, so rather than mock one up, this shows the one account-control
 * surface that's actually real and actually works here.
 */
export function AppUIAccount({ className }: { className?: string }) {
  return (
    <div className={`flex w-full flex-col items-center gap-2 ${className || ""}`}>
      <ProfileButton user={DEMO_USER} awayUsers={new Set()} />
      <div className="w-full max-w-[320px] -mt-2">
        <PreferencesTab />
      </div>
    </div>
  );
}

export default AppUIAccount;
