"use client";

import type { CSSProperties } from "react";
import { motion } from "framer-motion";

/**
 * A handful of original, comic-style space illustrations (thick ink
 * outlines, flat arcade-palette fills) plus a twinkling starfield —
 * ambient decor scattered around the hero, behind the rocket and copy.
 */

function Comet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 220 110" className={className}>
      <defs>
        <linearGradient id="comet-tail" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFD23F" stopOpacity="0" />
          <stop offset="100%" stopColor="#FFD23F" stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <path
        d="M0,55 L150,30 L170,45 L150,60 L170,70 L150,80 Z"
        fill="url(#comet-tail)"
      />
      <circle
        cx="182"
        cy="55"
        r="26"
        fill="#FF3D8A"
        stroke="#0b0b10"
        strokeWidth="7"
      />
      <circle cx="174" cy="47" r="7" fill="#fff" opacity="0.8" />
    </svg>
  );
}

function RingedPlanet({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 140" className={className}>
      <defs>
        <clipPath id="ringed-planet-clip">
          <circle cx="100" cy="70" r="52" />
        </clipPath>
      </defs>
      <ellipse
        cx="100"
        cy="70"
        rx="95"
        ry="24"
        fill="none"
        stroke="#0b0b10"
        strokeWidth="18"
        transform="rotate(-12 100 70)"
      />
      <ellipse
        cx="100"
        cy="70"
        rx="95"
        ry="24"
        fill="none"
        stroke="#FFD23F"
        strokeWidth="10"
        transform="rotate(-12 100 70)"
      />
      <circle cx="100" cy="70" r="52" fill="#38D66B" stroke="#0b0b10" strokeWidth="9" />
      <circle cx="122" cy="86" r="52" fill="#1f9c4d" clipPath="url(#ringed-planet-clip)" />
      <circle cx="82" cy="52" r="14" fill="#fff" opacity="0.25" clipPath="url(#ringed-planet-clip)" />
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

function Earth({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 140 140" className={className}>
      <defs>
        <clipPath id="earth-clip">
          <circle cx="70" cy="70" r="58" />
        </clipPath>
      </defs>
      <circle cx="70" cy="70" r="58" fill="#2E6FF2" stroke="#0b0b10" strokeWidth="9" />
      <g clipPath="url(#earth-clip)">
        <path d="M20,55 Q35,35 55,42 Q70,48 62,62 Q50,72 35,68 Q20,68 20,55 Z" fill="#38D66B" />
        <path
          d="M70,90 Q90,80 108,92 Q118,105 100,115 Q82,120 72,108 Q65,98 70,90 Z"
          fill="#38D66B"
        />
        <path d="M95,30 Q110,28 112,42 Q108,52 95,48 Q88,38 95,30 Z" fill="#38D66B" />
        <circle cx="95" cy="50" r="14" fill="#fff" opacity="0.25" />
        <circle cx="40" cy="95" r="10" fill="#fff" opacity="0.2" />
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

const props = [
  { El: Comet, top: "5%", left: "82%", size: 210, rotate: -20, opacity: 0.95, float: 12 },
  { El: RingedPlanet, top: "70%", left: "60%", size: 180, rotate: 8, opacity: 0.95, float: 16 },
  { El: Satellite, top: "18%", left: "46%", size: 160, rotate: -16, opacity: 0.95, float: 14 },
  { El: Earth, top: "70%", left: "24%", size: 140, rotate: 0, opacity: 1, float: 10 },
];

export function SpaceDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Twinkling starfield, replacing the old sunburst pattern. */}
      <div className="starfield starfield-twinkle absolute inset-0" />
      <div className="starfield starfield-twinkle-delayed absolute inset-0 [background-position:37px_19px]" />

      {props.map(({ El, top, left, size, rotate, opacity, float }, i) => (
        <motion.div
          key={i}
          className="absolute hidden sm:block"
          style={{ top, left, width: size, opacity }}
          initial={{ rotate }}
          animate={{ y: [0, -float, 0], rotate }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
        >
          <El className="h-auto w-full" />
        </motion.div>
      ))}

      {/* A few loose stars scattered independent of the starfield dots. */}
      {[
        { top: "22%", left: "48%", size: 16, color: "#FFD23F" },
        { top: "88%", left: "16%", size: 14, color: "#FF3D8A" },
        { top: "34%", left: "92%", size: 12, color: "#2E6FF2" },
        { top: "8%", left: "40%", size: 10, color: "#38D66B" },
      ].map((s, i) => (
        <SmallStar
          key={i}
          color={s.color}
          className="absolute"
          style={{ top: s.top, left: s.left, width: s.size, height: s.size } as CSSProperties}
        />
      ))}
    </div>
  );
}
