"use client";

import { motion } from "framer-motion";
import Image from "next/image";

/**
 * Landing-page-only showcase of the blob-character avatar set. These are
 * NOT fixed character identities — every avatar in the app is fully
 * user-customizable (pick a face, recolor it, rename it whenever). This
 * grid just samples fifteen of the starting avatar designs so visitors get
 * a feel for the art style before they ever sign up; it isn't a roster of
 * named "crew members" tied to those specific looks.
 *
 * Laid out as three rows of five, each row with its own eye direction +
 * mouth shape so the set doesn't read as fifteen clones of one template:
 *   Row 1 — straight eyes, soft smile
 *   Row 2 — eyes right, open grin
 *   Row 3 — eyes left, cheeky smirk
 */

interface AvatarEntry {
  /** Used only for alt text / animation keys — not shown as a UI label. */
  id: string;
  img: string;
  color: string;
}

const AVATARS: AvatarEntry[] = [
  // Row 1 — straight eyes, soft smile
  { id: "avatar-01", img: "/assets/sq.png", color: "#2E6FF2" },
  { id: "avatar-02", img: "/assets/pi.png", color: "#FFD23F" },
  { id: "avatar-03", img: "/assets/ch.png", color: "#FF3D8A" },
  { id: "avatar-04", img: "/assets/bu.png", color: "#38D66B" },
  { id: "avatar-05", img: "/assets/iris.png", color: "#B073FF" },
  // Row 2 — eyes right, open grin
  { id: "avatar-06", img: "/assets/blaze.png", color: "#FF8C42" },
  { id: "avatar-07", img: "/assets/luna.png", color: "#22D3EE" },
  { id: "avatar-08", img: "/assets/rusty.png", color: "#FF4136" },
  { id: "avatar-09", img: "/assets/sage.png", color: "#14B8A6" },
  { id: "avatar-10", img: "/assets/comet.png", color: "#FFB703" },
  // Row 3 — eyes left, cheeky smirk
  { id: "avatar-11", img: "/assets/pixel.png", color: "#E930C6" },
  { id: "avatar-12", img: "/assets/cobalt.png", color: "#1447E6" },
  { id: "avatar-13", img: "/assets/marigold.png", color: "#F5A623" },
  { id: "avatar-14", img: "/assets/slate.png", color: "#7C8798" },
  { id: "avatar-15", img: "/assets/coral.png", color: "#FF7A6B" },
];

export function AvatarShowcase() {
  return (
    <section className="relative mt-16 py-12 md:mt-24 md:py-24 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-white/50">
            Pick a face
          </span>
        </div>

        <h2 className="font-display text-3xl md:text-6xl text-center mb-6 tracking-tight">
          Pick Your Avatar
        </h2>
        <p className="text-center text-[#888] text-base sm:text-lg max-w-xl mx-auto mb-12">
          No selfies, no setup. Start with one of these, then make it yours —
          recolor it, rename it, or swap it for a new face any time.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {AVATARS.map((avatar, i) => (
            <motion.div
              key={avatar.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                ease: [0.21, 0.47, 0.32, 0.98],
                delay: (i % 5) * 0.06,
              }}
              whileHover={{ y: -4 }}
              className="group relative flex flex-col items-center justify-center rounded-[20px] border-[3px] border-[#0b0b10] bg-[#0f0f0f] p-4 sm:p-5 cursor-default transition-shadow duration-150"
              style={{ boxShadow: `5px 5px 0 0 ${avatar.color}` }}
            >
              <div
                className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden ring-2 ring-black/40 transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: `${avatar.color}22` }}
              >
                <Image
                  src={avatar.img}
                  alt="Sample avatar design, fully customizable in-app"
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-center text-[#666] text-xs sm:text-sm mt-8">
          A sample of the starting set — customize any of them, and more
          designs drop in every season.
        </p>
      </div>
    </section>
  );
}

export default AvatarShowcase;
