"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeroSpace } from "./HeroSpace";
import { ControllerArt } from "./ControllerArt";

interface HeroProps {
  handleEnter?: () => void;
}

interface Pow {
  id: number;
  x: number;
  y: number;
  rotate: number;
}

export function Hero({}: HeroProps) {
  const [pows, setPows] = useState<Pow[]>([]);

  const handleControllerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now() + Math.random();
    setPows((prev) => [...prev, { id, x, y, rotate: Math.random() * 30 - 15 }]);
    window.setTimeout(() => {
      setPows((prev) => prev.filter((p) => p.id !== id));
    }, 650);
  };

  return (
    <section className="relative flex min-h-screen w-full items-center justify-center overflow-hidden">
      {/* Deep-space backdrop: dark gradient sky, twinkling starfield,
          scattered comic stars, and a crescent moon. The old comet/ringed
          planet/satellite/earth decor in SpaceDecor.tsx is left untouched
          in the project — it's just not rendered here anymore. */}
      <HeroSpace />

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_60%_at_50%_45%,transparent_35%,rgba(0,0,0,0.55)_100%)]" />

      {/* Orbital game controller — the uploaded orbital-controller_1.svg,
          now centered as the single hero visual, large and unobstructed
          (also kept as a real file at /public/assets/svg/orbital-controller.svg).
          Tap/click it for the comic "POW!" hit effect. */}
      <motion.div
        className="relative z-10 mt-40 w-[86%] max-w-[880px] cursor-pointer sm:mt-32 md:w-[70%] lg:w-[60%]"
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        onClick={handleControllerClick}
      >
        {/* A handful of scattered comic stars around the controller. */}
        {[
          { top: "-4%", left: "88%", size: 24, color: "#FFD23F" },
          { top: "78%", left: "96%", size: 18, color: "#FF3D8A" },
          { top: "90%", left: "-3%", size: 16, color: "#2E6FF2" },
          { top: "-3%", left: "4%", size: 14, color: "#38D66B" },
        ].map((s, i) => (
          <svg
            key={i}
            viewBox="0 0 24 24"
            style={{ position: "absolute", top: s.top, left: s.left, width: s.size, height: s.size }}
            className="pointer-events-none"
          >
            <path
              d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z"
              fill={s.color}
              stroke="#0b0b10"
              strokeWidth="1"
              strokeLinejoin="round"
            />
          </svg>
        ))}

        {/* Floating — the console gently bobs in place, like it's drifting
            in zero-g alongside the rocket and satellite. */}
        <motion.div
          animate={{ y: [0, -16, 0] }}
          transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <ControllerArt className="pointer-events-none relative block h-auto w-full drop-shadow-[0_18px_40px_rgba(0,0,0,0.55)]" />
        </motion.div>

        {/* Tap/click "POW" bursts — a comic hit-effect. */}
        <AnimatePresence>
          {pows.map((pow) => (
            <motion.div
              key={pow.id}
              className="pointer-events-none absolute z-20 select-none"
              style={{ left: pow.x, top: pow.y, translateX: "-50%", translateY: "-50%" }}
              initial={{ scale: 0.3, opacity: 1, rotate: pow.rotate }}
              animate={{ scale: 1.3, opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <span className="font-display text-2xl text-arcade-yellow [-webkit-text-stroke:2px_#0b0b10] [paint-order:stroke_fill]">
                POW!
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </section>
  );
}
