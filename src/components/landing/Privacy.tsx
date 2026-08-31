"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ShieldKeyIcon,
  Home09Icon,
  GameController01Icon,
  BubbleChatIcon,
} from "@hugeicons/core-free-icons";
import { FeatureAppMock } from "@/components/mocks";

const features = [
  {
    title: "Game Nights",
    description: "Jump into Anomaly with friends, right from the app.",
    icon: GameController01Icon,
  },
  {
    title: "Friends",
    description: "1:1 chats with the people you keep close.",
    icon: BubbleChatIcon,
  },
  {
    title: "Private Rooms",
    description: "Your own space for your people — organized, just yours.",
    icon: Home09Icon,
  },
  {
    title: "Encrypted Calls",
    description: "Every call is end-to-end encrypted, start to finish.",
    icon: ShieldKeyIcon,
  },
];

export function Privacy() {
  const [active, setActive] = useState(0);

  return (
    <section className="relative md:mt-32 text-white overflow-hidden">
      <h2 className="font-display text-center text-3xl md:text-6xl flex justify-center gap-4">
        <motion.span
          initial={{ opacity: 0, x: 100, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 0.8,
          }}
          viewport={{ once: true }}
        >
          Inside
        </motion.span>
        <motion.span
          initial={{ opacity: 0, x: 100, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          transition={{
            type: "spring",
            stiffness: 100,
            damping: 20,
            duration: 0.8,
            delay: 0.2,
          }}
          viewport={{ once: true }}
        >
          Out
        </motion.span>
      </h2>

      <div className="md:mt-20 mt-8 max-w-5xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {features.map((feature, i) => {
          const isActive = active === i;
          return (
            <motion.button
              key={feature.title}
              type="button"
              onClick={() => setActive(i)}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: i * 0.1,
                ease: [0.21, 0.47, 0.32, 0.98],
              }}
              viewport={{ once: true }}
              className={`arcade-outline arcade-press relative h-32 md:h-36 w-full rounded-3xl flex flex-col items-center justify-center gap-2 text-center px-4 transition-colors ${
                isActive
                  ? "arcade-shadow arcade-shadow-pink bg-[#141018]"
                  : "arcade-shadow arcade-shadow-blue bg-[#0a0a0d] hover:bg-[#141018]"
              }`}
            >
              <HugeiconsIcon
                icon={feature.icon}
                className={`h-6 w-6 ${isActive ? "text-arcade-pink" : "text-arcade-yellow"}`}
              />
              <span className="text-sm md:text-base font-semibold text-white leading-snug max-w-[140px]">
                {feature.title}
              </span>
            </motion.button>
          );
        })}
      </div>

      <div className="mt-8 md:mt-12 max-w-2xl mx-auto px-6 text-center">
        <p className="text-sm md:text-base text-white/60">
          {features[active].description}
        </p>
      </div>

      <div className="mt-6 px-6 flex justify-center">
        <FeatureAppMock active={active} />
      </div>
    </section>
  );
}
