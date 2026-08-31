"use client";

import { motion } from "framer-motion";
import {
  RoomItemMock,
  FriendItemMock,
  ActiveCallMock,
  MessageNotificationMock,
  AnomalyGameMock,
} from "@/components/mocks";

const goodstuff = [
  {
    title: "Personal & Group Chats",
    desc: "Message a friend one-on-one or drop into a room with everyone — same chat, same message bar, just more people in it.",
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
    component: (
      <div className="flex mt-8 w-full items-center justify-center">
        <ActiveCallMock className="origin-center " />
      </div>
    ),
  },
  {
    title: "Notifications",
    desc: "Get pinged the moment a message lands or someone @mentions you — nothing to refresh, nothing to miss.",
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
          <div className="relative rounded-[32px] bg-white/[0.01] p-2 sm:rounded-[40px] sm:p-3">
            <div
              className="pointer-events-none absolute inset-0 rounded-[32px] border border-white/10 sm:rounded-[40px]"
              style={{
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent, black, transparent)",
                maskImage:
                  "linear-gradient(to bottom, transparent, black, transparent)",
              }}
            />

            <div className="flex flex-col gap-3 md:gap-4">
              {goodstuff.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.8,
                    ease: [0.21, 0.47, 0.32, 0.98],
                    delay: i * 0.1,
                  }}
                  viewport={{ once: true }}
                  className="relative rounded-[28px] bg-[#0a0a0d] sm:rounded-[32px]"
                >
                  <div
                    className="pointer-events-none absolute inset-0 rounded-[28px] border border-white/10 sm:rounded-[32px]"
                    style={{
                      WebkitMaskImage:
                        "linear-gradient(to bottom, transparent, black, transparent)",
                      maskImage:
                        "linear-gradient(to bottom, transparent, black, transparent)",
                    }}
                  />

                  <div className="relative flex flex-col overflow-hidden  p-8 lg:p-12">
                    <div className="flex flex-col justify-start">
                      <h3 className="text-xl font-medium tracking-tight text-white sm:text-2xl">
                        {item.title}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-[#888] sm:mt-4 sm:text-lg">
                        {item.desc}
                      </p>
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
      </div>
    </section>
  );
}
