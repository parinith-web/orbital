"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/**
 * Landing-page-only showcase of the blob-character avatar set. Pulls in
 * the same four avatars already used around the marketing page (Wave,
 * Volt, Ember, Nova — see AppUICalls.tsx / BasicsCovered.tsx) plus six
 * new characters drawn in the same style so the roster reads as one
 * consistent set, not a mismatched add-on.
 */

interface AvatarEntry {
  name: string;
  img: string;
  color: string;
}

const AVATARS: AvatarEntry[] = [
  { name: "Wave", img: "/assets/sq.png", color: "#2E6FF2" },
  { name: "Volt", img: "/assets/pi.png", color: "#FFD23F" },
  { name: "Ember", img: "/assets/ch.png", color: "#FF3D8A" },
  { name: "Nova", img: "/assets/bu.png", color: "#38D66B" },
  { name: "Iris", img: "/assets/iris.png", color: "#B073FF" },
  { name: "Blaze", img: "/assets/blaze.png", color: "#FF8C42" },
  { name: "Luna", img: "/assets/luna.png", color: "#22D3EE" },
  { name: "Rusty", img: "/assets/rusty.png", color: "#FF4136" },
  { name: "Sage", img: "/assets/sage.png", color: "#14B8A6" },
  { name: "Comet", img: "/assets/comet.png", color: "#FFB703" },
];

export function AvatarShowcase() {
  return (
    <section className="relative py-12 md:py-24 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-white/50">
            Pick a face
          </span>
        </div>

        <h2 className="font-display text-3xl md:text-6xl text-center mb-6 tracking-tight">
          Meet The Crew
        </h2>
        <p className="text-center text-[#888] text-base sm:text-lg max-w-xl mx-auto mb-12">
          No selfies, no setup. Grab one of these on your way in and swap it
          any time you feel like a new face.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {AVATARS.map((avatar, i) => (
            <motion.div
              key={avatar.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                ease: [0.21, 0.47, 0.32, 0.98],
                delay: (i % 5) * 0.06,
              }}
              whileHover={{ y: -4 }}
              className="group relative flex flex-col items-center gap-3 rounded-[20px] border-[3px] border-[#0b0b10] bg-[#0f0f0f] p-4 sm:p-5 cursor-default transition-shadow duration-150"
              style={{ boxShadow: `5px 5px 0 0 ${avatar.color}` }}
            >
              <div
                className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden ring-2 ring-black/40 transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: `${avatar.color}22` }}
              >
                <Image
                  src={avatar.img}
                  alt={avatar.name}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
              <span className="text-sm sm:text-base font-medium text-white">
                {avatar.name}
              </span>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-[#666] text-xs sm:text-sm mt-8">
          Ten to start. More drop in every season.
        </p>
      </div>
    </section>
  );
}

export default AvatarShowcase;
