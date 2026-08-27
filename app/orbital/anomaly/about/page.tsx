"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { AnomalyLandingPage } from "@/components/features/anomaly/AnomalyLandingPage";
import { ROUTES } from "@/lib/constants/routes";

/**
 * `/orbital/anomaly/about` — Anomaly's full-screen landing page, reached
 * by clicking the game's artwork on the Game Hub tile.
 *
 * Moved here (a sibling of the `/orbital/anomaly` matchmaking route, both
 * outside the `(main)` route group) instead of living inside `(main)` the
 * way it first shipped. It used to render with the `LeftSidebar` chrome
 * still visible, which cramped it into the same width as a chat pane;
 * the skribbl.io reference this page is modeled on is a full-bleed page
 * with nothing else on screen, and now this one is too. The auth guard
 * mirrors `/orbital/anomaly/page.tsx` next door since this route lost the
 * `(main)` group's own auth handling along with its sidebar.
 */
export default function Page() {
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded && !userId) {
      router.replace(ROUTES.HOME);
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded || !userId) return null;

  return <AnomalyLandingPage />;
}
