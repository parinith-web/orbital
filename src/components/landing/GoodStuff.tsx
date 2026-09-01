"use client";

import type { CSSProperties } from "react";
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

// Fixed per-card wall tilt + vertical offset — not randomized per page
// load, so the "pinned to a wall" arrangement is consistent and
// reviewable. Rotation is only ever applied at `sm:` and up (see
// `.wall-card-tilt` in globals.css); on mobile every card sits flat in a
// straight single-column stack regardless of these values.
const goodstuff = [
  {
    title: "Personal & Group Chats",
    desc: "One-on-one or a full room — same chat, just more people in it.",
    accent: "blue" as Accent,
    icon: BubbleChatIcon,
    stats: ["1:1 or group", "Text + media"],
    rotation: -3,
    offsetY: -12,
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
    desc: "Call one friend or the whole room, and switch anytime.",
    accent: "pink" as Accent,
    icon: Mic01Icon,
    stats: ["Voice & video", "Switch anytime"],
    rotation: 2,
    offsetY: 12,
    component: (
      <div className="flex mt-4 w-full items-center justify-center">
        <ActiveCallMock className="origin-center " />
      </div>
    ),
  },
  {
    title: "Notifications",
    desc: "Pinged the moment something lands — nothing to miss.",
    accent: "yellow" as Accent,
    icon: Notification03Icon,
    stats: ["Instant", "@mentions"],
    rotation: -2,
    offsetY: -12,
    component: (
      <div className="w-full max-w-[350px]">
        <MessageNotificationMock
          name="Moss"
          avatar="/assets/bu.png"
          message="Hi, what's up?"
          room="orbital"
          stacked={true}
          className="mt-4"
        />
      </div>
    ),
  },
  {
    title: "Game Hub",
    desc: "Anomaly: a word-based imposter game. Talk it out, then vote.",
    accent: "green" as Accent,
    icon: PlayCircleIcon,
    stats: ["Party game", "Voice required"],
    rotation: 3,
    offsetY: 12,
    component: (
      <div className="flex mt-4 w-full items-center justify-center">
        <AnomalyGameMock />
      </div>
    ),
  },
];

export function GoodStuff() {
  return (
    <section className="mt-24 px-4 text-white sm:px-6 md:mt-32 lg:mt-[200px]">
      <div className="mx-auto max-w-6xl">
        <h2 className="font-display text-center text-4xl leading-tight md:text-6xl">
          The Good <br className="md:hidden" /> Stuff
        </h2>

        {/* Backdrop sits behind just the card cluster (not the whole
            section) — reuses `.halftone`, the same dot texture already
            used inside each card's header strip, at reduced opacity so
            the grid reads as a surface the cards are pinned to. */}
        <div className="relative mt-16 md:mt-20">
          <div
            className="halftone wall-backdrop absolute -inset-x-4 -inset-y-8 -z-10 rounded-[32px] sm:-inset-x-8"
            aria-hidden="true"
          />

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-16 xl:grid-cols-4">
            {goodstuff.map((item, i) => (
              <div
                key={i}
                className="wall-card-tilt"
                style={
                  {
                    "--card-rotate": `${item.rotation}deg`,
                    "--card-offset": `${item.offsetY}px`,
                  } as CSSProperties
                }
              >
                <motion.div
                  initial={{ opacity: 0, y: 30, rotate: -item.rotation }}
                  whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                  whileHover={{ y: -4, rotate: (-item.rotation * 2) / 3 }}
                  transition={{
                    duration: 0.8,
                    ease: [0.21, 0.47, 0.32, 0.98],
                    delay: i * 0.15,
                  }}
                  viewport={{ once: true }}
                  className={`arcade-outline arcade-shadow arcade-shadow-${item.accent} arcade-press relative flex h-full flex-col overflow-hidden rounded-2xl bg-[#0a0a0d]`}
                >
                  {/* Header strip: accent-tinted halftone band + icon badge,
                      same comic-marquee treatment as the wordmark badge in
                      Navbar.tsx, sized to sit flush against the outline. */}
                  <div
                    className="halftone relative flex h-12 items-center border-b-[3px] border-[#0b0b10] px-6 sm:h-14 lg:px-8"
                    style={{ backgroundColor: `${ACCENT_HEX[item.accent]}1a` }}
                  >
                    <span
                      className="arcade-outline flex h-9 w-9 items-center justify-center rounded-full text-[#0b0b10] sm:h-10 sm:w-10"
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
                          className="h-4 w-4 sm:h-5 sm:w-5"
                          strokeWidth={2}
                        />
                      </motion.span>
                    </span>
                  </div>

                  <div className="relative flex flex-col overflow-hidden p-6 lg:p-8">
                    <div className="flex flex-col justify-start">
                      <h3 className="text-lg font-medium tracking-tight text-white sm:text-xl">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-snug text-[#888] sm:mt-3 sm:text-base">
                        {item.desc}
                      </p>
                    </div>

                    {/* Stat tags: same pill treatment as the @Ember/@Wave/@Volt
                        mention pills in BasicsCovered.tsx, reused here in the
                        card's own accent color. */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
