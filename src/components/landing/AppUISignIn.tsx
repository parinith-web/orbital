"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { FingerAccessIcon } from "@hugeicons/core-free-icons";
import { ProfileButton } from "@/components/features/profile/ProfileButton";
import type { User } from "@/lib/types";

const DEMO_USER: User = {
  user_id: "demo_9f1c2a7e8b3d",
  username: "Wave",
  avatar: "/assets/sq.png",
};

/**
 * `ProfileButton` is real, live production code — it takes a `User` and
 * an `awayUsers` set as props and reads only `useRouter`/`useUIStore`
 * (no Convex query), so it's safe to mount with demo data. Clicking it
 * does exactly what it does in the app: navigates to /orbital/settings,
 * which — with no session on a marketing page — bounces to /login, a
 * fitting real behavior for a "Secure Sign-In" preview.
 */
export function AppUISignIn({ className }: { className?: string }) {
  return (
    <div className={`flex w-full flex-col items-center gap-4 ${className || ""}`}>
      <div className="flex items-center gap-1.5 rounded-full border border-[#242424] bg-[#101010] px-3 py-1 text-[11px] font-medium text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Verified device
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-[#242424] bg-[#101010] px-4 py-2.5 text-xs text-white/70">
        <HugeiconsIcon icon={FingerAccessIcon} className="h-4 w-4 text-white/70" />
        Passkey sign-in enabled — no password stored, anywhere.
      </div>
      <ProfileButton user={DEMO_USER} awayUsers={new Set()} />
    </div>
  );
}

export default AppUISignIn;
