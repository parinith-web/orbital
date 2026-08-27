"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useCurrentUser } from "@/hooks";
import { ROUTES } from "@/lib/constants/routes";
import { AnomalyArtwork } from "@/components/features/anomaly/AnomalyArtwork";

/**
 * H6.2 — Game Hub, the real `/orbital` home.
 *
 * H7 UPDATE: this used to be one game tile with its icon, description, and
 * Create Room / Join Room / Play Online stacked as buttons right here (see
 * git history for that version). That put the full pitch-and-action card
 * on the hub itself, which fought with the sidebar chrome for space and
 * didn't leave room for more tiles later the way H6.2's own plan intended.
 *
 * Now the hub just shows the game's box art (`AnomalyArtwork`) — a single
 * clickable piece representing Anomaly, not a form. Clicking it is the
 * only interaction: it routes to `/orbital/anomaly/about`, which is now a
 * genuine full-screen landing page (outside the `(main)` sidebar group,
 * same as the `/orbital/anomaly` matchmaking route) modeled on skribbl.io
 * — hero art, then Play Online / Join Room / Create Room, then how to
 * play. That page owns all three entry points and the rules explainer;
 * this one no longer needs to duplicate any of it.
 */
export default function Page() {
  const router = useRouter();
  const setUser = useUserStore((s) => s.setUser);
  const { user: profile } = useCurrentUser();

  useEffect(() => {
    if (profile) {
      setUser(profile);
    }
  }, [profile, setUser]);

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <AnomalyArtwork
        className="max-w-md"
        onClick={() => router.push(ROUTES.ORBITAL_ANOMALY_ABOUT)}
      />
    </div>
  );
}
