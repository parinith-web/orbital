"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  HashtagIcon,
  PlayCircleIcon,
  BubbleChatIcon,
  ViewOffSlashIcon,
  Tick01Icon,
  Mic01Icon,
  CrownIcon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui";
import { useUIStore } from "@/store/uiStore";
import { ROUTES } from "@/lib/constants/routes";
import { AnomalyLogo } from "./AnomalyLogo";

/**
 * The Anomaly "about" / landing page — reached by clicking the Anomaly
 * logo on the Game Hub tile (`app/orbital/(main)/page.tsx`). Distinct from
 * that tile on purpose: the tile is the fast path for someone who already
 * knows the game and just wants a button, this page is the pitch for
 * everyone else — what it is, how a round actually plays out, and then
 * the same three entry points once they're sold.
 *
 * Modeled loosely on skribbl.io's landing page (hero -> big primary
 * action -> About / How to play), reskinned into this app's dark
 * purple/theme-accent surface language instead of skribbl's flat
 * primary-color blocks, and swapping skribbl's static "News" column for
 * an "Inside a round" walkthrough + feature grid, since Anomaly doesn't
 * have a devlog to show off but does have mechanics worth explaining.
 */
const HOW_TO_PLAY = [
  {
    icon: UserGroupIcon,
    title: "Get seated",
    body: "Create a room and share the code, join a friend's with theirs, or hit Play Online to get matched instantly.",
  },
  {
    icon: BubbleChatIcon,
    title: "Everyone gets a word",
    body: "Almost everyone gets the same secret word. One or more imposters get something close, but not quite right.",
  },
  {
    icon: Mic01Icon,
    title: "Talk it out",
    body: "Take turns describing your word without saying it. Vague enough to hide an imposter, specific enough to prove you're not one.",
  },
  {
    icon: ViewOffSlashIcon,
    title: "Vote out the anomaly",
    body: "Discuss who sounded off, then vote. Guess wrong and the imposter blends in for another round.",
  },
];

const FEATURES = [
  {
    icon: Mic01Icon,
    title: "Built-in voice & video",
    body: "No third-party call link — everyone talks in the same room they're playing in.",
  },
  {
    icon: HashtagIcon,
    title: "Private rooms",
    body: "Spin up a room, share a 6-character code, and only the people you invite can get in.",
  },
  {
    icon: PlayCircleIcon,
    title: "Public matchmaking",
    body: "Don't feel like waiting on friends? Play Online drops you straight into an open lobby.",
  },
  {
    icon: CrownIcon,
    title: "Live leaderboard",
    body: "Points carry across rounds so the group always knows who's actually good at this.",
  },
];

export function AnomalyLandingPage() {
  const router = useRouter();
  const setModal = useUIStore((s) => s.setModal);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-6 py-14 flex flex-col gap-20">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center text-center gap-6"
        >
          <AnomalyLogo className="w-20 h-20" glow />

          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold text-white tracking-tight">Anomaly</h1>
            <p className="text-base text-gray-400 max-w-lg mx-auto leading-relaxed">
              A word-based imposter game. Everyone gets a word, one of you
              doesn&apos;t — talk it out over voice, then vote before the
              anomaly gets away with it.
            </p>
          </div>

          <div className="w-full max-w-xs flex flex-col gap-2 mt-2">
            <Button
              variant="primary"
              size="lg"
              className="w-full justify-center gap-2"
              onClick={() => setModal("CREATE_GAME_ROOM")}
            >
              <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
              Create Room
            </Button>
            <Button
              variant="secondary"
              size="lg"
              className="w-full justify-center gap-2"
              onClick={() => setModal("JOIN_GAME_ROOM")}
            >
              <HugeiconsIcon icon={HashtagIcon} className="w-4 h-4" />
              Join Room
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full justify-center gap-2"
              onClick={() => router.push(ROUTES.ORBITAL_ANOMALY)}
            >
              <HugeiconsIcon icon={PlayCircleIcon} className="w-4 h-4" />
              Play Online
            </Button>
          </div>
        </motion.section>

        {/* How to play */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-xl font-medium text-white">How to play</h2>
            <p className="text-sm text-gray-400">One round, four beats.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {HOW_TO_PLAY.map((step, i) => (
              <div
                key={step.title}
                className="bg-theme-surface border border-theme-border rounded-2xl p-5 flex gap-4"
              >
                <div className="shrink-0 w-9 h-9 rounded-xl bg-theme-hover flex items-center justify-center relative">
                  <HugeiconsIcon icon={step.icon} className="w-4 h-4 text-white" />
                  <span
                    className="absolute -top-2 -left-2 w-5 h-5 rounded-full text-[10px] font-medium flex items-center justify-center text-white"
                    style={{ backgroundColor: "var(--theme-accent-color)" }}
                  >
                    {i + 1}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{step.title}</h3>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Feature grid */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1 text-center">
            <h2 className="text-xl font-medium text-white">Why Anomaly</h2>
            <p className="text-sm text-gray-400">Everything you need is already in the room.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-theme-surface border border-theme-border rounded-2xl p-5 flex flex-col gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-theme-hover flex items-center justify-center">
                  <HugeiconsIcon icon={feature.icon} className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{feature.title}</h3>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Closing CTA */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center text-center gap-4 bg-theme-surface border border-theme-border rounded-2xl px-8 py-10"
        >
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4" style={{ color: "var(--theme-accent-color)" }} />
            <span className="text-sm text-gray-400">No download, no setup — just a room code.</span>
          </div>
          <h2 className="text-xl font-medium text-white">Think you can spot the anomaly?</h2>
          <Button
            variant="primary"
            size="lg"
            className="gap-2 px-8"
            onClick={() => router.push(ROUTES.ORBITAL_ANOMALY)}
          >
            <HugeiconsIcon icon={PlayCircleIcon} className="w-4 h-4" />
            Play Online
          </Button>
        </motion.section>
      </div>
    </div>
  );
}
