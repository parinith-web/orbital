"use client";

import { motion } from "framer-motion";

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden border-t-4 border-[#0b0b10] bg-[#0a080b] text-white">
      {/* Marquee light strip along the top edge, like the bulb row on an
          arcade cabinet header. */}
      <div className="marquee-lights absolute left-1/2 top-0 z-[2] -translate-x-1/2 -translate-y-1/2 text-arcade-yellow">
        <span style={{ animationDelay: "0s" }} />
        <span style={{ animationDelay: "0.3s" }} />
        <span style={{ animationDelay: "0.6s" }} />
        <span style={{ animationDelay: "0.9s" }} />
        <span style={{ animationDelay: "1.2s" }} />
      </div>

      {/* Same soft color-glow backdrop used behind the rest of the page,
          so the footer reads as a continuation of the page, not a
          separate light-mode panel bolted on the end. */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 85% 0%, rgba(255,61,138,0.14), transparent 60%), radial-gradient(ellipse 55% 55% at 10% 100%, rgba(46,111,242,0.16), transparent 65%)",
        }}
      />
      <div className="halftone pointer-events-none absolute inset-0 z-0 opacity-[0.04]" />

      <div className="relative z-[1] mx-auto flex max-w-7xl flex-col items-center gap-10 px-6 py-16 md:flex-row md:items-center md:justify-between md:px-12 md:py-20">
        <div className="flex flex-col items-center text-center md:items-start md:text-left">
          <span className="font-display text-2xl tracking-wide text-white">
            Orbital
          </span>
          <span className="mt-2 max-w-xs text-sm text-gray-400">
            Chat, call, and play
            <br className="hidden md:block" /> all in one room.
          </span>
        </div>

        <motion.div
          initial={{ scale: 0.7, rotate: -6, opacity: 0 }}
          whileInView={{ scale: 1, rotate: -6, opacity: 1 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 140, damping: 12 }}
          className="arcade-outline arcade-shadow arcade-shadow-pink relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-[#141418] text-center md:h-32 md:w-32"
        >
          <div className="halftone absolute inset-0 rounded-full opacity-10" />
          <span className="relative font-display text-xs leading-tight text-white md:text-sm">
            THANKS
            <br />
            FOR
            <br />
            PLAYING
          </span>
        </motion.div>
      </div>

      <div className="relative z-[1] border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 px-6 py-6 text-center text-xs text-gray-500 md:flex-row md:justify-between md:px-12 md:text-left">
          <span>
            &copy; {new Date().getFullYear()} Orbital. All rights reserved.
          </span>
          <span className="text-gray-600">
            Made for late-night rooms and chaotic game nights.
          </span>
        </div>
      </div>
    </footer>
  );
}
