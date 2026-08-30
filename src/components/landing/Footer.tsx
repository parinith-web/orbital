"use client";

import { motion } from "framer-motion";
import Image from "next/image";

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

      <div className="relative z-[1001] flex-1 p-12 md:p-20">
        <span className="font-display text-xl text-arcade-ink">Orbital</span>
        <span className="text-gray-500 block text-sm mt-1">
          Chat, call, and play
          <br />
          all in one room
        </span>
        <div className="flex gap-3 mt-4">
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="arcade-outline arcade-shadow arcade-press flex items-center justify-center p-2.5 rounded-xl bg-white cursor-pointer"
            onClick={() =>
              window.open("https://github.com/vmridul/orbital", "_blank")
            }
          >
            <Image
              src="/assets/github-icon.png"
              alt="Github"
              width={20}
              height={20}
            />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            className="arcade-outline arcade-shadow arcade-press flex items-center justify-center p-2.5 rounded-xl bg-white cursor-pointer"
            onClick={() =>
              window.open(
                "https://www.linkedin.com/in/mridul-verma-a875aa256/",
                "_blank",
              )
            }
          >
            <Image
              src="/assets/linkdin-icon.png"
              alt="Linkedin"
              width={20}
              height={20}
            />
          </motion.button>
        </div>
      </div>

      {/* Color-blocked, halftone-textured side panel — cabinet side-art
          instead of a pixel-particle field. */}
      <div className="relative z-[1000] flex h-40 w-full items-center justify-center overflow-hidden border-t-4 border-[#0b0b10] md:h-auto md:w-[45%] md:border-l-4 md:border-t-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, #2E6FF2 0%, #2E6FF2 33%, #FF3D8A 33%, #FF3D8A 66%, #FFD23F 66%, #FFD23F 100%)",
          }}
        />
        <div className="halftone absolute inset-0 opacity-20" />
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
