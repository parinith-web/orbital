"use client";

import { motion } from "framer-motion";

/**
 * Comic-style Satellite illustration, matching the ink outline + flat
 * arcade-palette style used in SpaceDecor.tsx, so the footer's orbit motif
 * ties back visually to the rest of the brand.
 */
function Satellite({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className}>
      <rect x="1" y="55" width="46" height="14" rx="3" fill="#2E6FF2" stroke="#0b0b10" strokeWidth="6" />
      <rect x="9" y="60" width="8" height="4" fill="#fff" opacity="0.6" />
      <rect x="20" y="60" width="8" height="4" fill="#fff" opacity="0.6" />
      <rect x="153" y="55" width="46" height="14" rx="3" fill="#2E6FF2" stroke="#0b0b10" strokeWidth="6" />
      <rect x="163" y="60" width="8" height="4" fill="#fff" opacity="0.6" />
      <rect x="174" y="60" width="8" height="4" fill="#fff" opacity="0.6" />
      <line x1="47" y1="62" x2="72" y2="62" stroke="#0b0b10" strokeWidth="6" />
      <line x1="128" y1="62" x2="153" y2="62" stroke="#0b0b10" strokeWidth="6" />
      <rect x="70" y="40" width="60" height="45" rx="10" fill="#FFD23F" stroke="#0b0b10" strokeWidth="8" />
      <circle cx="100" cy="62" r="12" fill="#FF3D8A" stroke="#0b0b10" strokeWidth="6" />
    </svg>
  );
}

export function Footer() {
  return (
    <section className="relative flex w-full flex-col overflow-hidden bg-white md:flex-row">
      {/* Marquee light strip along the top edge, like the bulb row on an
          arcade cabinet header. */}
      <div className="marquee-lights absolute left-1/2 top-0 z-[1002] -translate-x-1/2 translate-y-[-50%] text-arcade-yellow">
        <span style={{ animationDelay: "0s" }} />
        <span style={{ animationDelay: "0.3s" }} />
        <span style={{ animationDelay: "0.6s" }} />
        <span style={{ animationDelay: "0.9s" }} />
        <span style={{ animationDelay: "1.2s" }} />
      </div>

      <div className="relative z-[1001] flex flex-1 flex-col justify-between p-12 md:p-20">
        <div>
          <span className="font-display text-xl text-arcade-ink">
            Orbital
          </span>
          <span className="text-gray-500 block text-sm mt-1">
            Chat, call, and play
            <br />
            all in one room
          </span>
        </div>

        <span className="text-gray-400 block text-xs mt-10 md:mt-0">
          &copy; {new Date().getFullYear()} Orbital. All rights reserved.
        </span>
      </div>

      {/* Color-blocked, halftone-textured side panel, now a two-tone
          diagonal (blue/pink) parallelogram — its own left edge slants the
          same way the internal blue/pink divider does, like a cut cabinet
          side-art panel rather than a plain rectangle — with a satellite
          drifting around the oval "thanks for playing" badge. */}
      <div className="relative z-[1000] flex h-72 w-full items-center justify-center overflow-hidden border-t-4 border-[#0b0b10] md:h-auto md:w-[58%] md:border-t-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, #2E6FF2 0%, #2E6FF2 45%, #FF3D8A 45%, #FF3D8A 100%)",
            clipPath: "polygon(14% 0%, 100% 0%, 100% 100%, 0% 100%)",
          }}
        />
        {/* Ink-stroked left edge of the panel, following the same
            clip-path line, since a CSS clip-path can't itself carry a
            visible stroke. */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <line
            x1="14"
            y1="0"
            x2="0"
            y2="100"
            stroke="#0b0b10"
            strokeWidth="1.4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <div
          className="halftone absolute inset-0 opacity-20"
          style={{ clipPath: "polygon(14% 0%, 100% 0%, 100% 100%, 0% 100%)" }}
        />

        {/* dashed oval orbit ring around the badge */}
        <svg
          viewBox="0 0 340 260"
          className="pointer-events-none absolute h-[220px] w-[300px] opacity-70 md:h-[280px] md:w-[380px]"
        >
          <ellipse
            cx="170"
            cy="130"
            rx="150"
            ry="110"
            fill="none"
            stroke="#0b0b10"
            strokeWidth="3"
            strokeDasharray="10 10"
          />
        </svg>

        <motion.div
          className="absolute left-[10%] top-[16%] w-28 md:w-36"
          animate={{ y: [0, -12, 0], rotate: [-8, 4, -8] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Satellite className="h-auto w-full drop-shadow-[2px_2px_0_#0b0b10]" />
        </motion.div>

        <motion.div
          initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
          whileInView={{ scale: 1, rotate: -8, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 140, damping: 12 }}
          className="arcade-outline relative flex h-32 w-44 items-center justify-center rounded-full bg-white text-center md:h-40 md:w-56"
        >
          <span className="font-display text-xs leading-tight text-arcade-ink md:text-sm">
            THANKS
            <br />
            FOR
            <br />
            PLAYING
          </span>
        </motion.div>
      </div>
    </section>
  );
}
