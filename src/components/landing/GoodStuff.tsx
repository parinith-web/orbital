"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  BubbleChatIcon,
  Mic01Icon,
  Notification03Icon,
  PlayCircleIcon,
} from "@hugeicons/core-free-icons";
import {
  RoomItemMock,
  FriendItemMock,
  ActiveCallMock,
  MessageNotificationMock,
  AnomalyGameMock,
} from "@/components/mocks";

// Accent maps 1:1 to the `.arcade-shadow-{accent}` utilities in
// app/globals.css — keep in sync if a color is added/removed there.
type Accent = "blue" | "pink" | "yellow" | "green";

// Same hex values as the `.arcade-shadow-*` rules in globals.css, so the
// header strip tint and icon badge line up exactly with the card's shadow
// color instead of drifting to a different "blue"/"pink"/etc.
const ACCENT_HEX: Record<Accent, string> = {
  blue: "#2e6ff2",
  pink: "#ff3d8a",
  yellow: "#ffd23f",
  green: "#38d66b",
};

const goodstuff = [
  {
    title: "Personal & Group Chats",
    desc: "Message a friend one-on-one or drop into a room with everyone — same chat, same message bar, just more people in it.",
    accent: "blue" as Accent,
    icon: BubbleChatIcon,
    stats: ["1:1 or group", "Text + media"],
    component: (
      <div className="mx-auto grid mt-4 w-full max-w-[560px] grid-cols-1 gap-1 sm:grid-cols-2 sm:gap-2 lg:max-w-[640px]">
        <RoomItemMock name="Projects" id="4567" className="w-full" />
        <RoomItemMock
          name="Roooom"
          id="1345"
          className="md:flex hidden w-full"
        />
        <FriendItemMock
          name="Volt"
          avatar="/assets/pi.png"
          message="You: zap zap!"
          className="w-full"
        />
        <FriendItemMock
          name="Ember"
          avatar="/assets/ch.png"
          message="im burning"
          className="w-full"
        />
      </div>
    ),
  },
  {
    title: "Voice & Video Calls",
    desc: "Start a call with one friend or the whole room, and switch between them without ever hanging up.",
    accent: "pink" as Accent,
    icon: Mic01Icon,
    stats: ["Voice & video", "Switch anytime"],
    component: (
      <div className="flex mt-8 w-full items-center justify-center">
        <ActiveCallMock className="origin-center " />
      </div>
    ),
  },
  {
    title: "Notifications",
    desc: "Get pinged the moment a message lands or someone @mentions you — nothing to refresh, nothing to miss.",
    accent: "yellow" as Accent,
    icon: Notification03Icon,
    stats: ["Instant", "@mentions"],
    component: (
      <div className="w-full max-w-[350px]">
        <MessageNotificationMock
          name="Moss"
          avatar="/assets/bu.png"
          message="Hi, what's up?"
          room="orbital"
          stacked={true}
          className="mt-8"
        />
      </div>
    ),
  },
  {
    title: "Game Hub",
    desc: "Jump into Anomaly, a word-based imposter game. Everyone gets a word, one of you doesn't — talk it out over voice, then vote them out.",
    accent: "green" as Accent,
    icon: PlayCircleIcon,
    stats: ["Party game", "Voice required"],
    component: (
      <div className="flex mt-8 w-full items-center justify-center">
        <AnomalyGameMock />
      </div>
    ),
  },
];

export function GoodStuff() {
  return (
    <section className="mt-24 px-4 text-white sm:px-6 md:mt-32 lg:mt-[200px]">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:gap-12">
        <div className="md:text-start text-center w-full lg:w-1/2">
          <div className="lg:sticky lg:top-48">
            <h2 className="font-display text-4xl leading-tight md:text-6xl">
              The Good <br /> Stuff
            </h2>
          </div>
        </div>

        <div className="w-full lg:w-1/2 py-0">
          <div className="flex flex-col gap-6 md:gap-8">
            {goodstuff.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                whileHover={{ y: -4, rotate: i % 2 === 0 ? -0.5 : 0.5 }}
                transition={{
                  duration: 0.8,
                  ease: [0.21, 0.47, 0.32, 0.98],
                  delay: i * 0.1,
                }}
                viewport={{ once: true }}
                className={`arcade-outline arcade-shadow arcade-shadow-${item.accent} arcade-press relative flex flex-col overflow-hidden rounded-2xl bg-[#0a0a0d]`}
              >
                {/* Header strip: accent-tinted halftone band + icon badge,
                    same comic-marquee treatment as the wordmark badge in
                    Navbar.tsx, sized to sit flush against the outline. */}
                <div
                  className="halftone relative flex h-16 items-center border-b-[3px] border-[#0b0b10] px-8 sm:h-[72px] lg:px-12"
                  style={{ backgroundColor: `${ACCENT_HEX[item.accent]}1a` }}
                >
                  <span
                    className="arcade-outline flex h-11 w-11 items-center justify-center rounded-full text-[#0b0b10] sm:h-12 sm:w-12"
                    style={{ backgroundColor: ACCENT_HEX[item.accent] }}
                  >
                    <motion.span
                      className="flex items-center justify-center"
                      animate={{ scale: [1, 1.12, 1] }}
                      transition={{
                        duration: 2.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.3,
                      }}
                    >
                      <HugeiconsIcon
                        icon={item.icon}
                        className="h-5 w-5 sm:h-6 sm:w-6"
                        strokeWidth={2}
                      />
                    </motion.span>
                  </span>
                </div>

                <div className="relative flex flex-col overflow-hidden p-8 lg:p-12">
                  <div className="flex flex-col justify-start">
                    <h3 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-base leading-relaxed text-[#888] sm:mt-4 sm:text-lg">
                      {item.desc}
                    </p>
                  </div>

                  {/* Stat tags: same pill treatment as the @Ember/@Wave/@Volt
                      mention pills in BasicsCovered.tsx, reused here in the
                      card's own accent color. */}
                  <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5">
                    {item.stats.map((stat) => (
                      <span
                        key={stat}
                        className="arcade-outline rounded-full px-3 py-1 text-xs font-medium text-white"
                        style={{
                          backgroundColor: `${ACCENT_HEX[item.accent]}26`,
                        }}
                      >
                        {stat}
                      </span>
                    ))}
                  </div>

                  <div className={`flex w-full items-center justify-center`}>
                    {item.component}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
