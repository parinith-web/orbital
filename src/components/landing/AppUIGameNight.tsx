"use client";

import { AnomalyWordScatter, HandCircle } from "@/components/features/anomaly/AnomalyWordScatter";

/**
 * Game Nights tile — just the real Game Hub's own cover art
 * (`AnomalyWordScatter` + the hand-circled "Anomaly" title, same as
 * `AnomalyArtwork.tsx`), no in-round snapshot. This is what a visitor
 * actually lands on first in the real app, so it's the truer "here's the
 * game" preview for the marketing page.
 */

export function AppUIGameNight({ className }: { className?: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center p-6 ${className || ""}`}>
      <div className="relative w-full max-w-md aspect-[16/9] overflow-hidden rounded-3xl bg-black">
        <AnomalyWordScatter />
        <div className="relative flex h-full items-center justify-center">
          <span
            className="relative text-4xl font-semibold text-white tracking-tight -rotate-2"
            style={{ fontFamily: "var(--font-pop, inherit)" }}
          >
            <HandCircle rotate={2} />
            <span className="relative">Anomaly</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default AppUIGameNight;
