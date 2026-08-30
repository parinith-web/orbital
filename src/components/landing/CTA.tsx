"use client";

import { motion } from "framer-motion";
import { AsciiArt } from "@/components/ui/AsciiArt";

interface CTAProps {
  handleEnter: () => void;
}

export function CTA({ handleEnter }: CTAProps) {
  return (
    <section className="py-8 px-6 md:px-12 relative overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex relative flex-col items-center text-center">
          <div className="max-w-3xl mb-24 items-center flex flex-col ">
            <h2 className="font-display text-2xl md:text-6xl text-white tracking-tight leading-[1.05]">
              Ready to Enter Orbit?
            </h2>
            <div className="relative mt-8">
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                onClick={handleEnter}
                className="arcade-outline arcade-shadow arcade-shadow-pink arcade-press relative z-10 cursor-pointer rounded-2xl px-8 py-3.5 bg-arcade-pink text-white text-base font-display uppercase tracking-wide transition-colors duration-200"
              >
                Enter
              </motion.button>
            </div>
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute top-12 right-20"
            >
              <AsciiArt size="md" color="text-white/40" />
            </motion.div>
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.8,
                ease: [0.21, 0.47, 0.32, 0.98],
                delay: 0.15,
              }}
              className="absolute top-12 left-48"
            >
              <AsciiArt size="sm" color="text-white/30" inverted />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
