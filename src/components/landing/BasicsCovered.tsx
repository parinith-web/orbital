"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SmartPhone01Icon,
  MoreHorizontalIcon,
  AtIcon,
  WifiIcon,
} from "@hugeicons/core-free-icons";
import {
  MentionsAutocompleteMock,
  ChatMessageMock,
  ChatInputBarMock,
  TypingIndicatorMock,
} from "@/components/mocks";
import { StatusIndicator } from "@/components/ui/StatusIndicator";

// Same accent system as GoodStuff.tsx — keep the hex values in sync with
// `.arcade-shadow-*` in app/globals.css. Reused here (rather than shared)
// to match how each landing section already keeps its own local copy.
type Accent = "blue" | "pink" | "yellow" | "green";

const ACCENT_HEX: Record<Accent, string> = {
  blue: "#2e6ff2",
  pink: "#ff3d8a",
  yellow: "#ffd23f",
  green: "#38d66b",
};

// Header strip shared by every tile in this section: halftone-tinted band
// + icon badge, identical treatment to the trading-card headers in
// GoodStuff.tsx, so this section reads as the same "arcade panel"
// language instead of a plain flat card.
function TileHeader({
  icon,
  title,
  accent,
}: {
  icon: Parameters<typeof HugeiconsIcon>[0]["icon"];
  title: string;
  accent: Accent;
}) {
  return (
    <div
      className="relative flex h-14 shrink-0 items-center gap-3 border-b-[3px] border-[#0b0b10] px-6"
      style={{ backgroundColor: `${ACCENT_HEX[accent]}1a` }}
    >
      <span
        className="arcade-outline flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#0b0b10]"
        style={{ backgroundColor: ACCENT_HEX[accent] }}
      >
        <HugeiconsIcon icon={icon} className="h-4 w-4" strokeWidth={2} />
      </span>
      <h3 className="text-lg font-medium tracking-tight text-white">
        {title}
      </h3>
    </div>
  );
}

export function BasicsCovered() {
  return (
    <section className="relative py-12 md:py-24 text-white">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="font-display text-3xl md:text-6xl text-center mb-6 tracking-tight">
          Basics Covered
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 min-h-[500px]">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="arcade-outline arcade-shadow arcade-shadow-blue md:flex hidden md:col-span-2 row-span-2 bg-[#0a0a0d] rounded-2xl overflow-hidden flex-col relative cursor-default"
          >
            <TileHeader
              icon={SmartPhone01Icon}
              title="Flawless On Mobile Too"
              accent="blue"
            />

            <div className="relative flex-1 w-full overflow-hidden">
              <motion.div
                initial={{ y: 80, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                transition={{
                  type: "spring",
                  stiffness: 120,
                  damping: 20,
                  delay: 0.3,
                }}
                className="arcade-outline arcade-shadow arcade-shadow-blue absolute -bottom-[70px] left-4 w-[300px] overflow-hidden rounded-2xl bg-[#0a0a0d] transition-all duration-500 md:block hidden"
              >
                <div className="flex items-center gap-2 border-b-2 border-[#0b0b10] bg-[#141418] px-3 py-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ACCENT_HEX.pink }}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ACCENT_HEX.yellow }}
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: ACCENT_HEX.green }}
                  />
                  <span className="ml-auto font-display text-[0.6rem] uppercase tracking-widest text-white/40">
                    Orbital
                  </span>
                </div>
                <div className="py-2">
                  <ChatMessageMock
                    name="Wave"
                    avatar="/assets/sq.png"
                    message="ok mine's something you'd find in a kitchen"
                    showDate={false}
                    className="pointer-events-none pb-2"
                  />
                  <ChatMessageMock
                    name="Volt"
                    avatar="/assets/pi.png"
                    message="wait that's literally what I got"
                    showDate={false}
                    isCurrentUser
                    className="pointer-events-none pb-2"
                  />
                  <ChatMessageMock
                    name="Wave"
                    avatar="/assets/sq.png"
                    message="then one of us is off-signal 👀"
                    showDate={false}
                    className="pointer-events-none"
                  />
                </div>
                <div className="px-2 pb-3 pt-1">
                  <ChatInputBarMock
                    accent={false}
                    className="pointer-events-none"
                  />
                </div>
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
              delay: 0.1,
            }}
            className="arcade-outline arcade-shadow arcade-shadow-pink md:col-span-2 row-span-1 bg-[#0a0a0d] rounded-2xl flex flex-col overflow-hidden relative cursor-default"
          >
            <TileHeader
              icon={MoreHorizontalIcon}
              title="Typing Indicators"
              accent="pink"
            />
            <div className="flex flex-1 flex-col items-center justify-center relative px-6 py-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
              >
                <ChatMessageMock
                  message="no way it's that obvious 👀"
                  name="Volt"
                  avatar="/assets/pi.png"
                  isCurrentUser
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
                  name="Ember"
                  avatar="/assets/ch.png"
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
              delay: 0.2,
            }}
            className="arcade-outline arcade-shadow arcade-shadow-yellow flex-1 bg-[#0a0a0d] rounded-2xl flex flex-col overflow-hidden relative cursor-default"
          >
            <TileHeader icon={AtIcon} title="Mentions" accent="yellow" />
            <div className="flex flex-1 flex-col items-center justify-center relative px-2 pb-6">
              <div className="flex items-center mb-4 text-xs gap-2">
                {[
                  { name: "@Ember", accent: "pink" as Accent },
                  { name: "@Wave", accent: "blue" as Accent },
                  { name: "@Volt", accent: "yellow" as Accent },
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
                    className="arcade-outline rounded-full px-2.5 py-1 font-medium text-white"
                    style={{
                      backgroundColor: `${ACCENT_HEX[tag.accent]}26`,
                    }}
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
                <MentionsAutocompleteMock className="scale-[0.6] z-20 shadow-2xl" />
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
            className="arcade-outline arcade-shadow arcade-shadow-green flex-1 bg-[#0a0a0d] rounded-2xl flex flex-col overflow-hidden relative cursor-default"
          >
            <TileHeader
              icon={WifiIcon}
              title="Realtime Presence"
              accent="green"
            />
            <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 pb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="arcade-outline flex w-[85%] items-center justify-center gap-2 rounded-xl bg-[#141418] px-4 py-2.5 relative text-xs"
              >
                <StatusIndicator
                  className="relative w-2 h-2"
                  isOnline={true}
                  isAway={false}
                />
                <span className="font-medium" style={{ color: ACCENT_HEX.green }}>
                  Online
                </span>
                <motion.div
                  animate={{ opacity: [0.2, 0.5, 0.2] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{ backgroundColor: `${ACCENT_HEX.green}0d` }}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.4 }}
                className="arcade-outline flex w-[85%] items-center justify-center gap-2 rounded-xl bg-[#141418] px-4 py-2.5 relative text-xs"
              >
                <StatusIndicator
                  className="relative w-2 h-2"
                  isOnline={false}
                  isAway={true}
                />
                <span
                  className="font-medium"
                  style={{ color: ACCENT_HEX.yellow }}
                >
                  Away
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
