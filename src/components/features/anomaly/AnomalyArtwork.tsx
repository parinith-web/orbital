"use client";

import { motion } from "framer-motion";
import { AnomalyWordScatter } from "./AnomalyWordScatter";

/**
 * The Game Hub's entry point into Anomaly — replaces what used to be a
 * plain icon+title+description card with one clickable piece of art.
 *
 * H9 UPDATE: the hand-drawn "ANOMALY" marker photo cover has been
 * replaced with the same scattered-word background used on the landing
 * page, with the game title set centered on top of it — keeps the cover
 * and the full landing page visually consistent instead of introducing a
 * second, unrelated cover treatment.
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
      whileHover={{ scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      aria-label="Open Anomaly — a word-based imposter game"
      className={`group relative w-full overflow-hidden rounded-3xl border border-theme-border bg-theme-surface text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40 ${className}`}
    >
      <div className="relative flex flex-col items-center gap-7 px-8 py-10">
        {/* Cover — scattered word background, matching the landing page,
            with the title centered on top */}
        <div className="relative w-full h-48 overflow-hidden rounded-2xl bg-black">
          <AnomalyWordScatter />
          <div className="relative flex h-full items-center justify-center">
            <span className="text-4xl font-semibold text-white tracking-tight">
              Anomaly
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
            A word-based imposter game. Everyone gets a word — one of you doesn&apos;t.
          </p>
          <span
            className="mt-2 text-xs font-medium text-white/70 opacity-0 -translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0"
          >
            Click to play →
          </span>
        </div>
      </div>
    </motion.button>
  );
}
