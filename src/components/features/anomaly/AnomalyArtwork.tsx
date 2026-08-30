"use client";

import Image from "next/image";
import { motion } from "framer-motion";

/**
 * The Game Hub's entry point into Anomaly — replaces what used to be a
 * plain icon+title+description card with one clickable piece of art.
 *
 * H8 UPDATE: the coded crowd-of-dots SVG + per-letter wordmark (see git
 * history) has been swapped for a hand-drawn cover image — a hand
 * circling the word "ANOMALY" in red marker — supplied as the game's
 * actual box art. Keeps the same clickable-tile contract (button wrapper,
 * ambient glow, hover affordance, description) so nothing else about the
 * hub had to change.
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
      {/* Ambient glow field */}
      <div
        className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full blur-3xl opacity-30 transition-opacity duration-500 group-hover:opacity-50"
        style={{ backgroundColor: "var(--theme-accent-color)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 h-52 w-52 rounded-full blur-3xl opacity-20 transition-opacity duration-500 group-hover:opacity-35"
        style={{ backgroundColor: "var(--theme-accent-color)" }}
      />

      <div className="relative flex flex-col items-center gap-7 px-8 py-10">
        {/* Cover art — hand circling "ANOMALY" in red marker */}
        <div className="relative w-full overflow-hidden rounded-2xl">
          <Image
            src="/assets/anomaly-cover.png"
            alt="A hand circling the word ANOMALY in red marker"
            width={961}
            height={580}
            className="w-full h-auto object-cover"
            priority
          />
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
