"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";

/**
 * Deep-space backdrop for the new controller-led Hero: a dark gradient sky,
 * a couple of twinkling starfield layers, a handful of loose comic-style
 * stars, and a crescent moon. Deliberately separate from `SpaceDecor.tsx` —
 * that file (comet / ringed planet / satellite / earth) is left completely
 * untouched and simply isn't rendered here anymore.
 */

function CrescentMoon({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 200 200" className={className} style={style}>
      <defs>
        <linearGradient id="moon-body" x1="15%" y1="10%" x2="90%" y2="95%">
          <stop offset="0%" stopColor="#FFF6D6" />
          <stop offset="45%" stopColor="#FFD23F" />
          <stop offset="100%" stopColor="#F0A400" />
        </linearGradient>
      </defs>

      {/* true crescent silhouette (two arcs of different radii bulging the
          same way — not a masked ring), so it renders crisp and solid at
          any size, with a comic-ink outline all the way around. */}
      <path
        d="M105,15 A85,85 0 1 1 105,185 A140,140 0 0 0 105,15 Z"
        fill="url(#moon-body)"
        stroke="#0b0b10"
        strokeWidth="8"
        strokeLinejoin="round"
      />

      {/* cartoonish sleepy-happy face on the crescent's visible mass */}
      <g stroke="#0b0b10" strokeWidth="6" strokeLinecap="round" fill="none">
        <path d="M128,86 Q136,74 144,86" />
        <path d="M158,90 Q166,78 174,90" />
        <path d="M136,112 Q152,126 170,110" />
      </g>
      <circle cx="122" cy="106" r="8" fill="#FF3D8A" opacity="0.5" />
      <circle cx="182" cy="100" r="8" fill="#FF3D8A" opacity="0.5" />
    </svg>
  );
}

function RocketArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 260" className={className}>
      <g stroke="#0b0b10" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round">
        {/* exhaust flame */}
        <path
          d="M80,196 C64,220 60,244 80,258 C100,244 96,220 80,196 Z"
          fill="#FFD23F"
        />
        <path
          d="M80,196 C70,214 68,230 80,242 C92,230 90,214 80,196 Z"
          fill="#FF3D8A"
        />

        {/* left fin */}
        <path d="M46,150 L14,204 C34,198 50,190 58,178 Z" fill="#2E6FF2" />
        {/* right fin */}
        <path d="M114,150 L146,204 C126,198 110,190 102,178 Z" fill="#2E6FF2" />

        {/* body */}
        <path
          d="M80,6 C112,42 124,96 118,150 C118,168 100,182 80,182
             C60,182 42,168 42,150 C36,96 48,42 80,6 Z"
          fill="#F4F4F4"
        />

        {/* nose cone */}
        <path d="M80,6 C96,26 106,50 108,72 L52,72 C54,50 64,26 80,6 Z" fill="#FF3D8A" />

        {/* window */}
        <circle cx="80" cy="108" r="22" fill="#2E6FF2" />
        <circle cx="80" cy="108" r="12" fill="#bfe0ff" />
      </g>
    </svg>
  );
}

function SatelliteArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 260 180" className={className}>
      <g stroke="#0b0b10" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round">
        {/* left solar panel */}
        <rect x="8" y="58" width="70" height="64" rx="6" fill="#2E6FF2" />
        <line x1="8" y1="74" x2="78" y2="74" strokeWidth="4" />
        <line x1="8" y1="90" x2="78" y2="90" strokeWidth="4" />
        <line x1="8" y1="106" x2="78" y2="106" strokeWidth="4" />
        <line x1="78" y1="90" x2="100" y2="90" />

        {/* right solar panel */}
        <rect x="182" y="58" width="70" height="64" rx="6" fill="#2E6FF2" />
        <line x1="182" y1="74" x2="252" y2="74" strokeWidth="4" />
        <line x1="182" y1="90" x2="252" y2="90" strokeWidth="4" />
        <line x1="182" y1="106" x2="252" y2="106" strokeWidth="4" />
        <line x1="160" y1="90" x2="182" y2="90" />

        {/* body */}
        <rect x="100" y="64" width="60" height="52" rx="10" fill="#FFD23F" />
        <circle cx="130" cy="90" r="14" fill="#FF3D8A" />

        {/* antenna */}
        <line x1="130" y1="64" x2="130" y2="24" />
        <circle cx="130" cy="18" r="8" fill="#38D66B" />

        {/* little feet */}
        <line x1="112" y1="116" x2="108" y2="134" />
        <line x1="148" y1="116" x2="152" y2="134" />
      </g>
    </svg>
  );
}

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

      {/* crescent moon, upper right — pushed down clear of the fixed navbar */}
      <motion.div
        className="absolute right-[6%] top-24 w-[120px] -rotate-12 sm:top-28 sm:w-[150px] md:top-28 md:w-[180px]"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: [0, -10, 0] }}
        transition={{ opacity: { duration: 0.8 }, y: { duration: 6, repeat: Infinity, ease: "easeInOut" } }}
      >
        <CrescentMoon className="h-auto w-full" />
      </motion.div>

      {/* rocket, drifting in the free space to the left of the controller */}
      <motion.div
        className="absolute left-[3%] top-[26%] hidden w-[120px] sm:block sm:w-[150px] md:left-[6%] md:w-[170px] lg:w-[190px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: [0, -18, 0], x: [0, 8, 0], rotate: [14, 24, 14] }}
        transition={{
          opacity: { duration: 0.8 },
          y: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
          x: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 5.5, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <RocketArt className="h-auto w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
      </motion.div>

      {/* satellite, drifting in the free space to the right of the controller */}
      <motion.div
        className="absolute right-[1%] top-[54%] hidden w-[180px] sm:block sm:w-[210px] md:right-[2%] md:w-[235px] lg:w-[265px]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: [0, 16, 0], rotate: [-16, -25, -16] }}
        transition={{
          opacity: { duration: 0.8, delay: 0.2 },
          y: { duration: 6.5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 6.5, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <SatelliteArt className="h-auto w-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
      </motion.div>

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
