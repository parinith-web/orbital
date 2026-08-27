"use client";

import { AnomalyLandingPage } from "@/components/features/anomaly/AnomalyLandingPage";

/**
 * `/orbital/anomaly/about` — the Anomaly game's landing page, reached by
 * clicking the logo on the Game Hub tile. Lives inside the `(main)` route
 * group (not next to the sibling `/orbital/anomaly` matchmaking route) so
 * it keeps the same LeftSidebar chrome as the rest of the app instead of
 * the full-bleed layout `PublicLobbyEntry`'s route uses.
 */
export default function Page() {
  return <AnomalyLandingPage />;
}
