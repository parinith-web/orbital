"use client";

import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import { Notification03Icon } from "@hugeicons/core-free-icons";
import { AnomalyArtwork } from "@/components/features/anomaly/AnomalyArtwork";
import { ROUTES } from "@/lib/constants/routes";

/**
 * `AnomalyArtwork` is the exact Game Hub tile a signed-in user clicks to
 * open Anomaly — purely presentational (art, copy, an onClick it doesn't
 * own). Wired here to the same place the landing page's other CTAs go.
 */
export function AppUIGameNight({ className }: { className?: string }) {
  const router = useRouter();

  return (
    <div className={`flex w-full flex-col items-center gap-3 ${className || ""}`}>
      <div className="flex items-center gap-1.5 rounded-full border border-[#242424] bg-[#101010] px-3 py-1 text-[11px] font-medium text-arcade-pink">
        <HugeiconsIcon icon={Notification03Icon} className="h-3.5 w-3.5" />
        Live game night
      </div>
      <AnomalyArtwork
        className="max-w-[360px]"
        onClick={() => router.push(ROUTES.ORBITAL)}
      />
    </div>
  );
}

export default AppUIGameNight;
