"use client";

import { motion } from "framer-motion";

/**
 * Small comic-style Rocket + Satellite illustrations, matching the ink
 * outline + flat arcade-palette style used in SpaceDecor.tsx, so the
 * footer's "orbit" motif ties back visually to the rest of the brand.
 */

function Rocket({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 200" className={className}>
      {/* exhaust flame */}
      <path
        d="M60 158 L44 190 Q60 178 76 190 Z"
        fill="#FFD23F"
        stroke="#0b0b10"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* fins */}
      <path
        d="M32 120 L2 158 L34 148 Z"
        fill="#2E6FF2"
        stroke="#0b0b10"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        d="M88 120 L118 158 L86 148 Z"
        fill="#2E6FF2"
        stroke="#0b0b10"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      {/* body */}
      <path
        d="M60 6 C86 34 92 78 88 132 L32 132 C28 78 34 34 60 6 Z"
        fill="#FF3D8A"
        stroke="#0b0b10"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      {/* window */}
      <circle cx="60" cy="70" r="20" fill="#fff" stroke="#0b0b10" strokeWidth="7" />
      <circle cx="60" cy="70" r="10" fill="#2E6FF2" />
    </svg>
  );
}

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

      {/* Color-blocked, halftone-textured side panel, now doubling as a
          little orbit scene: a satellite drifting up top, a rocket
          climbing from the bottom, and the "thanks for playing" badge
          sitting at the center like the planet they're circling. */}
      <div className="relative z-[1000] flex h-64 w-full items-center justify-center overflow-hidden border-t-4 border-[#0b0b10] md:h-auto md:w-[45%] md:border-l-4 md:border-t-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, #2E6FF2 0%, #2E6FF2 33%, #FF3D8A 33%, #FF3D8A 66%, #FFD23F 66%, #FFD23F 100%)",
          }}
        />
        <div className="halftone absolute inset-0 opacity-20" />

        {/* dashed orbit ring around the badge */}
        <svg
          viewBox="0 0 320 320"
          className="pointer-events-none absolute h-[240px] w-[240px] opacity-70 md:h-[300px] md:w-[300px]"
        >
          <circle
            cx="160"
            cy="160"
            r="140"
            fill="none"
            stroke="#0b0b10"
            strokeWidth="3"
            strokeDasharray="10 10"
          />
        </svg>

        <motion.div
          className="absolute left-[12%] top-[14%] w-14 md:w-16"
          animate={{ y: [0, -10, 0], rotate: [-8, 4, -8] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <Satellite className="h-auto w-full drop-shadow-[2px_2px_0_#0b0b10]" />
        </motion.div>

        <motion.div
          className="absolute bottom-[10%] right-[16%] w-10 md:w-12"
          animate={{ y: [0, -14, 0] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        >
          <Rocket className="h-auto w-full drop-shadow-[2px_2px_0_#0b0b10]" />
        </motion.div>

        <motion.div
          initial={{ scale: 0.6, rotate: -8, opacity: 0 }}
          whileInView={{ scale: 1, rotate: -8, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 140, damping: 12 }}
          className="arcade-outline relative flex h-28 w-28 items-center justify-center rounded-full bg-white text-center md:h-36 md:w-36"
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
