"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  ArrowLeft01Icon,
  HashtagIcon,
  PlayCircleIcon,
  BubbleChatIcon,
  ViewOffSlashIcon,
  Mic01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import { ROUTES } from "@/lib/constants/routes";
import { AnomalyWordScatter } from "./AnomalyWordScatter";

/**
 * Anomaly's full-screen landing page — reached by clicking the game's
 * artwork on the Game Hub tile (`app/orbital/(main)/page.tsx`). Rendered
 * from `app/orbital/anomaly/about/page.tsx`, which sits outside the
 * `(main)` route group specifically so this page gets the whole viewport
 * instead of the `LeftSidebar`-chromed content pane every other page in
 * the app uses. Distinct from the hub tile on purpose: the tile is the
 * fast path for someone who already knows the game, this page is the
 * pitch for everyone else — what it is, how a round actually plays out,
 * and then the same three entry points once they're sold.
 *
 * Modeled directly on skribbl.io's landing page (full-bleed hero -> big
 * primary actions -> About / How to play), reskinned into this app's dark
 * purple/theme-accent surface language instead of skribbl's flat
 * primary-color blocks. Since there's no sidebar here to navigate away
 * with, the top-left back link is this page's only way back to the Game
 * Hub.
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

export function AnomalyLandingPage() {
  const router = useRouter();
  const setModal = useUIStore((s) => s.setModal);

  return (
    <div className="relative flex-1 h-full overflow-y-auto bg-theme-surface">
      {/* Ambient background — this page owns the whole viewport now, so it
          gets to feel like a destination rather than another chat pane.
          H9 UPDATE: the plain dot-grid texture is now a scatter of
          game-themed words in mixed fonts, a few hand-circled in the
          accent color (see `AnomalyWordScatter`). */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <AnomalyWordScatter />
      </div>

      <button
        type="button"
        onClick={() => router.push(ROUTES.ORBITAL)}
        className="fixed top-5 left-5 z-10 flex items-center gap-2 rounded-xl border border-theme-border bg-theme-surface/80 backdrop-blur px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-theme-hover transition-colors"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} className="w-4 h-4" />
        Orbital
      </button>

      <div className="relative mx-auto w-full max-w-4xl px-6 py-14 flex flex-col gap-20">
        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="flex flex-col items-center text-center gap-5 pt-16"
        >
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-semibold text-white tracking-tight -translate-y-2">Anomaly</h1>
            <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
              One imposter. One word off.
              <br />
              Talk, then vote them out.
            </p>
          </div>

          <div className="w-full max-w-xs grid grid-cols-3 gap-2.5 mt-3">
            <button
              type="button"
              onClick={() => setModal("CREATE_GAME_ROOM")}
              className="group aspect-square rounded-2xl flex flex-col items-center justify-center gap-2 transition-colors"
              style={{ backgroundColor: "var(--theme-accent-color)" }}
            >
              <HugeiconsIcon icon={Add01Icon} className="w-5 h-5 text-black/80" />
              <span className="text-xs font-medium text-black/80 text-center leading-tight px-1">
                Create
              </span>
            </button>
            <button
              type="button"
              onClick={() => setModal("JOIN_GAME_ROOM")}
              className="aspect-square rounded-2xl border border-theme-border flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-white hover:bg-theme-hover transition-colors"
            >
              <HugeiconsIcon icon={HashtagIcon} className="w-5 h-5" />
              <span className="text-xs font-medium text-center leading-tight px-1">Join</span>
            </button>
            <button
              type="button"
              onClick={() => router.push(ROUTES.ORBITAL_ANOMALY)}
              className="aspect-square rounded-2xl border border-theme-border flex flex-col items-center justify-center gap-2 text-gray-300 hover:text-white hover:bg-theme-hover transition-colors"
            >
              <HugeiconsIcon icon={PlayCircleIcon} className="w-5 h-5" />
              <span className="text-xs font-medium text-center leading-tight px-1">Online</span>
            </button>
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
            {HOW_TO_PLAY.map((step) => (
              <div
                key={step.title}
                className="bg-theme-surface border border-theme-border rounded-2xl p-5 flex gap-4"
              >
                <div className="shrink-0 w-9 h-9 rounded-xl bg-theme-hover flex items-center justify-center">
                  <HugeiconsIcon icon={step.icon} className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{step.title}</h3>
                  <p className="text-sm text-gray-400 mt-1 leading-relaxed">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
