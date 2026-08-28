"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message01Icon,
  Video01Icon,
  Radar02Icon,
  ArrowRight02Icon,
  UserGroupIcon,
  Timer02Icon,
  TickDouble01Icon,
} from "@hugeicons/core-free-icons";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import PixelBlast from "@/components/effects/PixelBlast";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Public marketing landing page — the pitch for someone who's never used
 * Orbital, rendered from `app/page.tsx` only when signed out (signed-in
 * visitors get redirected straight to `/orbital` there, same as before this
 * page existed). Deliberately a separate component from
 * `AnomalyLandingPage` (reached *inside* the app, post-auth, from the Game
 * Hub tile) — that page is the pitch for one game to someone who already
 * has an account; this one is the pitch for the whole platform to someone
 * who doesn't.
 *
 * SIGNATURE ELEMENT: the "orbit" behind the hero headline — two concentric
 * rings, each with a small dot riding its edge. Rotating the ring container
 * is visually a no-op (a circle is rotationally symmetric), so the border
 * itself never appears to move — only the dot does, tracing a real orbit.
 * A literal orbit for a product called Orbital, rather than a generic glow
 * or gradient blob.
 */

const MODULES = [
  {
    icon: Message01Icon,
    title: "Rooms & DMs",
    body: "Group rooms for the whole crew, direct messages for just one person. Every conversation is saved and searchable later.",
  },
  {
    icon: Video01Icon,
    title: "Voice & video",
    body: "Jump on a call without leaving the chat. Share your screen and keep the conversation running underneath.",
  },
  {
    icon: Radar02Icon,
    title: "Anomaly",
    body: "A social deduction game built into every room. One player's word doesn't quite match — find them before they talk their way out.",
    tag: "Play",
  },
] as const;

const ANOMALY_FACTS = [
  { icon: UserGroupIcon, label: "3+ players" },
  { icon: Timer02Icon, label: "30s per turn" },
  { icon: TickDouble01Icon, label: "First to 10 wins" },
] as const;

const WORD_ROW = ["COFFEE", "COFFEE", "COFFEE", "TEA", "COFFEE", "COFFEE"];

function OrbitRings() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
    >
      <div className="relative w-[340px] h-[340px] sm:w-[480px] sm:h-[480px]">
        <div className="absolute inset-0 rounded-full border border-white/10" />
        <div
          className="absolute inset-0 rounded-full motion-safe:animate-[spin_28s_linear_infinite] motion-reduce:animate-none"
          style={{ animationDirection: "normal" }}
        >
          <div className="absolute -top-[3px] left-1/2 -translate-x-1/2 w-[6px] h-[6px] rounded-full bg-[#5EEAD4] shadow-[0_0_8px_2px_rgba(94,234,212,0.6)]" />
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[220px] h-[220px] sm:w-[320px] sm:h-[320px]">
          <div className="absolute inset-0 rounded-full border border-white/[0.07]" />
          <div className="absolute inset-0 rounded-full motion-safe:animate-[spin_18s_linear_infinite_reverse] motion-reduce:animate-none">
            <div className="absolute -top-[2px] left-1/2 -translate-x-1/2 w-[4px] h-[4px] rounded-full bg-theme-accent shadow-[0_0_6px_1px_var(--theme-accent-color)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function AnomalyWordRow() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      {WORD_ROW.map((word, i) => {
        const isAnomaly = word === "TEA";
        return (
          <div key={`${word}-${i}`} className="relative">
            <span
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium tracking-wide font-mono ${
                isAnomaly
                  ? "border-[#5EEAD4]/40 text-[#5EEAD4] bg-[#5EEAD4]/5"
                  : "border-theme-border text-gray-400 bg-theme-surface"
              }`}
            >
              {word}
            </span>
            {isAnomaly && (
              <svg
                aria-hidden
                viewBox="0 0 100 44"
                className="absolute -inset-x-2 -inset-y-2 w-[calc(100%+16px)] h-[calc(100%+16px)] pointer-events-none"
              >
                <ellipse
                  cx="50"
                  cy="22"
                  rx="47"
                  ry="19"
                  fill="none"
                  stroke="#5EEAD4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity={0.8}
                />
              </svg>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="relative w-full bg-theme-base overflow-x-hidden">
      {/* ---------------------------------------------------------------- */}
      {/* Hero                                                              */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden">
        {/* Tuned down from an earlier pass that ran patternDensity/liquid too
            hot — it read as bright static and drowned out the headline.
            Verified against a screenshot before landing on these values:
            low density + minimal liquid drift reads as a calm, fine-grained
            starfield instead of a dense moire block. */}
        <div className="absolute inset-0 opacity-[0.55]">
          <PixelBlast
            variant="circle"
            pixelSize={3}
            color="#8672D9"
            patternScale={2.6}
            patternDensity={0.42}
            liquid
            liquidStrength={0.02}
            liquidWobbleSpeed={1.2}
            enableRipples
            rippleIntensityScale={0.8}
            rippleThickness={0.12}
            rippleSpeed={0.35}
            speed={0.25}
            noiseAmount={0.02}
            transparent
            edgeFade={0.15}
          />
        </div>

        {/* edgeFade above only fades a thin strip right at the viewport
            border (smoothstep against distance-to-nearest-edge) — it does
            NOT produce a center vignette, so without this the field is at
            full brightness directly behind the headline. This radial
            gradient is centered on the headline specifically (not the
            viewport) so the text sits in a calm patch while the pattern
            still reads clearly toward the edges. */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 700px 480px at 50% 45%, hsl(var(--theme-bg-base)) 15%, transparent 70%)",
          }}
        />
        {/* Seam into the next section */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-theme-base" />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center px-6 gap-6 max-w-xl"
        >
          <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400">
            <span className="relative flex h-2 w-2">
              <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live in orbit
          </div>

          {/* OrbitRings lives inside this specific wrapper, not the whole
              section — it was originally centered on the full hero, but the
              flex column's *content block* (eyebrow+headline+subhead+CTAs)
              sits above true section-center as a group, so the ring ended up
              framing empty space below the headline instead of the headline
              itself. Wrapping just the headline fixes it directly rather
              than fudging an offset. */}
          <div className="relative flex items-center justify-center py-6">
            <OrbitRings />
            <h1
              className="relative text-5xl sm:text-6xl font-semibold tracking-tight text-white"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Gather your orbit.
            </h1>
          </div>

          <p className="text-base sm:text-lg text-gray-400 leading-relaxed max-w-md">
            Rooms for the group chat, calls for face time, and Anomaly when
            the room needs a game.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
            <SignUpButton mode="modal" forceRedirectUrl={ROUTES.ORBITAL}>
              <button
                type="button"
                className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--theme-accent-color)" }}
              >
                Enter Orbital
                <HugeiconsIcon
                  icon={ArrowRight02Icon}
                  className="w-4 h-4 transition-transform group-hover:translate-x-0.5"
                />
              </button>
            </SignUpButton>
            <SignInButton mode="modal" forceRedirectUrl={ROUTES.ORBITAL}>
              <button
                type="button"
                className="inline-flex items-center rounded-xl border border-theme-border px-6 py-3 text-sm font-medium text-gray-300 hover:text-white hover:bg-theme-hover transition-colors"
              >
                Sign in
              </button>
            </SignInButton>
          </div>

          <p className="text-[11px] font-mono uppercase tracking-[0.15em] text-gray-600">
            No download — runs in your browser
          </p>
        </motion.div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Modules                                                           */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative bg-theme-surface px-6 py-24 sm:py-28">
        <div className="mx-auto max-w-5xl flex flex-col gap-12">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-2 text-center"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-500">
              Modules
            </span>
            <h2
              className="text-2xl sm:text-3xl font-semibold text-white tracking-tight"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Everything happens in the same room.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {MODULES.map((module, i) => (
              <motion.div
                key={module.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, ease: "easeOut", delay: i * 0.08 }}
                className="bg-theme-base border border-theme-border rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-theme-hover flex items-center justify-center">
                    <HugeiconsIcon icon={module.icon} className="w-4.5 h-4.5 text-white" />
                  </div>
                  {"tag" in module && module.tag && (
                    <span
                      className="text-[10px] font-mono uppercase tracking-wider rounded-full px-2 py-1 text-[#5EEAD4] border border-[#5EEAD4]/30"
                    >
                      {module.tag}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-medium text-white">{module.title}</h3>
                  <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">{module.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Anomaly spotlight                                                 */}
      {/* ---------------------------------------------------------------- */}
      <section className="relative bg-theme-base px-6 py-24 sm:py-28 border-t border-theme-border">
        <div className="mx-auto max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-5"
          >
            <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-500">
              The game
            </span>
            <h2
              className="text-3xl sm:text-4xl font-semibold text-white tracking-tight"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              One word is off. Find it.
            </h2>
            <p className="text-sm sm:text-base text-gray-400 leading-relaxed max-w-md">
              Everyone gets the same secret word — except one player, who gets
              something close but not quite right. Take turns describing your
              word without saying it, then the room votes on who sounded off.
              Guess right and every correct voter scores a point. Guess wrong,
              or split the vote, and the anomaly scores two.
            </p>
            <div className="flex flex-wrap gap-4 pt-1">
              {ANOMALY_FACTS.map((fact) => (
                <div
                  key={fact.label}
                  className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide text-gray-500"
                >
                  <HugeiconsIcon icon={fact.icon} className="w-3.5 h-3.5" />
                  {fact.label}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
            className="bg-theme-surface border border-theme-border rounded-2xl p-8 sm:p-10 flex flex-col items-center gap-6"
          >
            <AnomalyWordRow />
            <p className="text-xs font-mono uppercase tracking-widest text-gray-600 text-center">
              Everyone said <span className="text-gray-400">coffee</span> — one player said{" "}
              <span className="text-[#5EEAD4]">tea</span>
            </p>
          </motion.div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {/* Footer                                                            */}
      {/* ---------------------------------------------------------------- */}
      <footer className="relative bg-theme-surface border-t border-theme-border px-6 py-10">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span
            className="text-lg text-white"
            style={{ fontFamily: "var(--font-galindo)" }}
          >
            Orbital
          </span>
          <p className="text-xs text-gray-500">
            Real-time rooms, calls, and games. &copy; {new Date().getFullYear()} Orbital.
          </p>
        </div>
      </footer>
    </div>
  );
}
