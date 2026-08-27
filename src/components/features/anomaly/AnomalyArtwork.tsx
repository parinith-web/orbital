"use client";

import { motion } from "framer-motion";

/**
 * The Game Hub's entry point into Anomaly — replaces what used to be a
 * plain icon+title+description card with one clickable piece of art.
 *
 * The idea: a crowd of identical little "player" dots, one of them subtly
 * off — wrong shape, wrong glow, standing slightly apart — same "spot the
 * imposter" pun as `AnomalyLogo`, just given room to breathe at hero size,
 * plus a colorful per-letter wordmark (a nod to skribbl.io's title art,
 * the reference this whole flow is modeled on) so the tile reads as a
 * game's box art rather than a settings icon.
 *
 * Entirely `currentColor`/`--theme-accent-color` driven — no hardcoded
 * hues besides white — so it stays coherent with whatever accent color
 * the user has picked, the same contract `AnomalyLogo` already keeps.
 *
 * Purely presentational: takes an onClick and gets out of the way. The
 * page wiring it up decides where that click goes (the full-screen
 * `/orbital/anomaly/about` landing page).
 */
type AnomalyArtworkProps = {
  onClick?: () => void;
  className?: string;
};

const CROWD = [
  { x: 42, y: 46 },
  { x: 92, y: 40 },
  { x: 148, y: 52 },
  { x: 206, y: 38 },
  { x: 264, y: 48 },
  { x: 66, y: 100 },
  { x: 124, y: 92 },
  { x: 236, y: 96 },
  { x: 292, y: 88 },
  { x: 48, y: 152 },
  { x: 168, y: 146 },
  { x: 226, y: 156 },
  { x: 284, y: 150 },
  { x: 100, y: 168 },
];

// The anomaly sits deliberately off-grid — a touch lower and further out
// than any neighbor — instead of dead center, so it reads as "apart from
// the crowd" rather than "the logo's focal point".
const ANOMALY = { x: 196, y: 118 };

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

      {/* Faint dot-grid texture, matching the crowd motif underneath */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]"
        aria-hidden
      >
        <pattern id="anomaly-artwork-grid" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.4" fill="white" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#anomaly-artwork-grid)" />
      </svg>

      <div className="relative flex flex-col items-center gap-7 px-8 py-12">
        {/* Wordmark */}
        <div className="flex items-center" aria-hidden>
          {"ANOMALY".split("").map((letter, i) => (
            <span
              key={i}
              className="text-4xl sm:text-5xl font-bold tracking-tight transition-transform duration-300"
              style={{
                color: i === 4 ? "var(--theme-accent-color)" : "white",
                opacity: i === 4 ? 1 : 0.92 - i * 0.02,
                transform: i === 4 ? "translateY(-2px)" : undefined,
              }}
            >
              {letter}
            </span>
          ))}
        </div>

        {/* The crowd — one glowing diamond hiding among circles */}
        <svg viewBox="0 0 330 210" className="h-32 w-auto sm:h-36" role="img" aria-labelledby="anomaly-art-title">
          <title id="anomaly-art-title">A crowd of identical players with one anomaly hidden among them</title>

          {CROWD.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="10"
              fill="white"
              fillOpacity="0.16"
              stroke="white"
              strokeOpacity="0.3"
            />
          ))}

          {/* Soft pulse behind the anomaly */}
          <circle
            cx={ANOMALY.x}
            cy={ANOMALY.y}
            r="22"
            fill="var(--theme-accent-color)"
            opacity="0.5"
            className="animate-fade-slow"
          />

          {/* Connecting "who's off?" lines from a couple of nearby players */}
          <line x1={168} y1={146} x2={ANOMALY.x} y2={ANOMALY.y} stroke="white" strokeOpacity="0.12" strokeDasharray="3 4" />
          <line x1={236} y1={96} x2={ANOMALY.x} y2={ANOMALY.y} stroke="white" strokeOpacity="0.12" strokeDasharray="3 4" />

          <rect
            x={ANOMALY.x - 11}
            y={ANOMALY.y - 11}
            width="22"
            height="22"
            rx="4"
            transform={`rotate(45 ${ANOMALY.x} ${ANOMALY.y})`}
            fill="var(--theme-accent-color)"
          />
          <rect
            x={ANOMALY.x - 11}
            y={ANOMALY.y - 11}
            width="22"
            height="22"
            rx="4"
            transform={`rotate(45 ${ANOMALY.x} ${ANOMALY.y})`}
            fill="none"
            stroke="white"
            strokeOpacity="0.4"
          />
        </svg>

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
