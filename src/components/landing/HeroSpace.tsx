"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";

/**
 * Deep-space backdrop for the controller-led Hero: a dark gradient sky, a
 * couple of twinkling starfield layers, and a handful of loose comic-style
 * stars. The moon/rocket/satellite art that used to float alongside the
 * console has been removed so the console can be the single, full-size
 * hero visual (see Hero.tsx). Deliberately separate from `SpaceDecor.tsx` —
 * that file (comet / ringed planet / satellite / earth) is left completely
 * untouched and simply isn't rendered here anymore.
 */

function SmallStar({
  color,
  className,
  style,
}: {
  color: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style}>
      <path
        d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
        fill={color}
        stroke="#0b0b10"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const scatteredStars = [
  { top: "10%", left: "12%", size: 14, color: "#FFD23F" },
  { top: "16%", left: "62%", size: 10, color: "#FF3D8A" },
  { top: "26%", left: "90%", size: 16, color: "#2E6FF2" },
  { top: "40%", left: "6%", size: 12, color: "#38D66B" },
  { top: "58%", left: "94%", size: 12, color: "#FFD23F" },
  { top: "72%", left: "10%", size: 10, color: "#FF3D8A" },
  { top: "84%", left: "70%", size: 14, color: "#2E6FF2" },
  { top: "6%", left: "38%", size: 8, color: "#38D66B" },
  { top: "50%", left: "48%", size: 8, color: "#fff" },
  { top: "20%", left: "28%", size: 10, color: "#fff" },
  { top: "34%", left: "78%", size: 8, color: "#FFD23F" },
  { top: "64%", left: "34%", size: 12, color: "#2E6FF2" },
  { top: "90%", left: "22%", size: 10, color: "#38D66B" },
  { top: "14%", left: "82%", size: 8, color: "#FF3D8A" },
  { top: "48%", left: "16%", size: 10, color: "#FFD23F" },
  { top: "78%", left: "88%", size: 10, color: "#fff" },
  { top: "4%", left: "58%", size: 8, color: "#2E6FF2" },
  { top: "92%", left: "52%", size: 8, color: "#FF3D8A" },
];

export function HeroSpace() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* deep space gradient sky */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 75% 15%, rgba(46,111,242,0.28), transparent 60%), linear-gradient(180deg, #050408 0%, #0a080b 55%, #0b0b10 100%)",
        }}
      />

      {/* twinkling starfield, two offset layers for depth */}
      <div className="starfield starfield-twinkle absolute inset-0" />
      <div className="starfield starfield-twinkle-delayed absolute inset-0 [background-position:37px_19px]" />

      {/* Moon / rocket / satellite removed — the console art is now the
          single hero visual, enlarged to fill the section (see Hero.tsx). */}

      {/* loose comic-style stars scattered across the hero */}
      {scatteredStars.map((s, i) => (
        <motion.div
          key={i}
          className="absolute hidden sm:block"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size }}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2.4 + (i % 4) * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.25 }}
        >
          <SmallStar color={s.color} className="h-full w-full" />
        </motion.div>
      ))}
    </div>
  );
}
