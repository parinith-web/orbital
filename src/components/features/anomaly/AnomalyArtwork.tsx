"use client";

import { motion } from "framer-motion";
import { AnomalyWordScatter, HandCircle } from "./AnomalyWordScatter";

/**
 * The Game Hub's entry point into Anomaly — replaces what used to be a
 * plain icon+title+description card with one clickable piece of art.
 *
 * H10 UPDATE: dropped the wrapping bordered card — the cover art now
 * *is* the tile, edge to edge, no surface/border box around it. The
 * title is drawn as part of the scattered-word composition (same
 * hand-circled treatment as "DECEIVE" / "MIMIC" in the background) so it
 * reads as one piece of art rather than UI text laid over a background.
 *
 * Purely presentational: takes an onClick and gets out of the way. The
 * page wiring it up decides where that click goes (the full-screen
 * `/orbital/anomaly/about` landing page).
 */
type AnomalyArtworkProps = {
  onClick?: () => void;
  className?: string;
};

export function AnomalyArtwork({ onClick, className = "" }: AnomalyArtworkProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      aria-label="Open Anomaly — a word-based imposter game"
      className={`group relative w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded-3xl ${className}`}
    >
      {/* Cover — the title is part of the artwork, not text over it.
          aspect-[4/3] keeps this rectangular at any container width,
          matching the marketing mock's reference cover in
          `AppUIGameNight.tsx` instead of the old fixed h-52, which read
          squarish on narrower panes. */}
      <div className="relative w-full aspect-[4/3] overflow-hidden rounded-3xl bg-black">
        <AnomalyWordScatter />
        <div className="relative flex h-full items-center justify-center">
          <span
            className="relative text-5xl font-semibold text-white tracking-tight -rotate-2"
            style={{ fontFamily: "var(--font-pop, inherit)" }}
          >
            <HandCircle rotate={2} />
            <span className="relative">Anomaly</span>
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1 text-center pt-4">
        <p className="text-sm text-gray-400">A word-imposter game</p>
        <span
          className="mt-1 text-xs font-medium text-white/70 opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
        >
          Click to play →
        </span>
      </div>
    </motion.button>
  );
}
