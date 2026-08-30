"use client";

import { motion } from "framer-motion";
import {
  MentionsAutocompleteMock,
  ChatMessageMock,
  TypingIndicatorMock,
} from "@/components/mocks";
import { StatusIndicator } from "@/components/ui/StatusIndicator";

export function BasicsCovered() {
  return (
    <section className="relative py-12 md:py-24 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-display text-3xl md:text-6xl text-center mb-6 tracking-tight">
          Basics Covered
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 min-h-[500px]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="md:flex hidden md:col-span-2 row-span-2 bg-[#0f0f0f] rounded-[24px] p-8 md:p-12 overflow-hidden justify-center items-end flex-col relative cursor-default"
          >
            <div
              className="absolute inset-0 rounded-[24px] border border-white/10 pointer-events-none"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, transparent 15%)",
                maskImage:
                  "linear-gradient(to bottom, black 0%, transparent 15%)",
              }}
            />

            <div className="relative z-10">
              <motion.h3
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-xl font-medium text-white text-end"
              >
                Flawless On
                <br /> Mobile Too
              </motion.h3>
            </div>

            <motion.div
              initial={{ y: 80, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 120,
                damping: 20,
                delay: 0.3,
              }}
              className="arcade-outline arcade-shadow arcade-shadow-yellow absolute -bottom-[200px] left-6 w-[260px] overflow-hidden rounded-2xl bg-[#0a0a0d] transition-all duration-500 md:block hidden"
            >
              <div className="flex items-center gap-2 border-b-2 border-[#0b0b10] bg-[#141418] px-3 py-2">
                <span className="h-2.5 w-2.5 rounded-full bg-arcade-pink" />
                <span className="h-2.5 w-2.5 rounded-full bg-arcade-yellow" />
                <span className="h-2.5 w-2.5 rounded-full bg-arcade-green" />
                <span className="ml-auto font-display text-[0.6rem] uppercase tracking-widest text-white/40">
                  Orbital
                </span>
              </div>
              <div className="py-2">
                <ChatMessageMock
                  name="Wave"
                  avatar="/assets/sq.png"
                  message="the black one... back row, near the window"
                  showDate={false}
                  className="pointer-events-none pb-2"
                />
                <ChatMessageMock
                  name="Volt"
                  avatar="/assets/pi.png"
                  message="nahhh that has my notes for tomorrow"
                  showDate={false}
                  className="pointer-events-none pb-2"
                />
                <ChatMessageMock
                  name="Wave"
                  avatar="/assets/sq.png"
                  message="relax, I gave it to the guard at the gate"
                  showDate={false}
                  className="pointer-events-none"
                />
              </div>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              ease: [0.21, 0.47, 0.32, 0.98],
              delay: 0.1,
            }}
            className="md:col-span-2 row-span-1 bg-[#0f0f0f] rounded-[24px] p-8 flex flex-col overflow-hidden relative cursor-default"
          >
            <div
              className="absolute inset-0 rounded-[24px] border border-white/10 pointer-events-none"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, transparent 15%)",
                maskImage:
                  "linear-gradient(to bottom, black 0%, transparent 15%)",
              }}
            />
            <div className="space-y-4 mb-6 relative z-10">
              <h3 className="text-xl font-medium text-white">Mentions</h3>
            </div>
            <div className="flex flex-col items-center justify-start relative h-32">
              <div className="flex items-center mb-4 text-sm gap-2">
                {[
                  { name: "@Chip", color: "bg-[#FF3D8A]" },
                  { name: "@Wave", color: "bg-[#2E6FF2]" },
                  { name: "@Volt", color: "bg-[#FFD23F]" },
                ].map((tag, idx) => (
                  <motion.span
                    key={tag.name}
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{
                      delay: 0.5 + idx * 0.1,
                      type: "spring",
                      stiffness: 200,
                    }}
                    className={`${tag.color} bg-opacity-50 text-gray-100 rounded-sm px-1`}
                  >
                    {tag.name}
                  </motion.span>
                ))}
              </div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
              >
                <MentionsAutocompleteMock className="md:scale-110 scale-[0.75] z-20 shadow-2xl" />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              ease: [0.21, 0.47, 0.32, 0.98],
              delay: 0.2,
            }}
            className="flex-1 bg-[#0f0f0f] rounded-[24px] p-8 px-2 flex flex-col justify-between relative cursor-default"
          >
            <div
              className="absolute inset-0 rounded-[24px] border border-white/10 pointer-events-none"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, transparent 15%)",
                maskImage:
                  "linear-gradient(to bottom, black 0%, transparent 15%)",
              }}
            />
            <div className="space-y-0 px-6 relative z-10">
              <h3 className="text-xl font-medium text-white">
                Typing Indicators
              </h3>
            </div>
            <div className="flex flex-col mr-4 items-center justify-start">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <ChatMessageMock
                  message="zap zap!"
                  name="Ember"
                  avatar="/assets/ch.png"
                  showDate={false}
                  className="w-full md:flex hidden pointer-events-none"
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <TypingIndicatorMock
                  name="Volt"
                  avatar="/assets/pi.png"
                  className="scale-110 md:mt-0 mt-6"
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              duration: 0.8,
              ease: [0.21, 0.47, 0.32, 0.98],
              delay: 0.3,
            }}
            className="flex-1 bg-[#0f0f0f] rounded-[24px] p-8 flex flex-col justify-between relative overflow-hidden cursor-default"
          >
            <div
              className="absolute inset-0 rounded-[24px] border border-white/10 pointer-events-none"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, black 0%, transparent 15%)",
                maskImage:
                  "linear-gradient(to bottom, black 0%, transparent 15%)",
              }}
            />
            <div className="space-y-4 relative z-10">
              <h3 className="text-xl font-medium text-white">
                Realtime Presence
              </h3>
              <div className="flex flex-col scale-110 items-center justify-center pt-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="mt-2 flex py-2.5 px-6 justify-center w-[80%] bg-[#242424] relative items-center gap-2 rounded-lg text-xs"
                >
                  <StatusIndicator
                    className="relative w-2 h-2"
                    isOnline={true}
                    isAway={false}
                  />
                  <span className="text-green-500 font-medium">Online</span>
                  <motion.div
                    animate={{ opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 bg-green-500/5 rounded-lg pointer-events-none"
                  />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.4 }}
                  className="mt-2 flex py-2.5 px-6 justify-center w-[80%] bg-[#242424] relative items-center gap-2 rounded-lg text-xs"
                >
                  <StatusIndicator
                    className="relative w-2 h-2"
                    isOnline={false}
                    isAway={true}
                  />
                  <span className="text-yellow-400 font-medium">Away</span>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
