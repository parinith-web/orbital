"use client";

import Link from "next/link";
import { AvatarMaker } from "@/components/avatar";

// Standalone route so the avatar maker can be built and reviewed on its
// own, without needing it wired into the authenticated /orbital shell or
// a real profile field yet. Once we're ready to use these as profile
// pics, <AvatarMaker onSave={...}/> just needs a real handler passed in —
// nothing about this page or the maker itself needs to change.
export default function AvatarMakerPage() {
  return (
    <div className="min-h-screen bg-[#0a080b] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 70% 60% at 65% 10%, rgba(46,111,242,0.25), transparent 60%), radial-gradient(ellipse 60% 50% at 15% 80%, rgba(255,61,138,0.18), transparent 65%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-10 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-white transition-colors mb-8"
        >
          ← Back home
        </Link>

        <div className="text-center mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-white/50">
            Avatar maker
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-6xl text-center mb-4 tracking-tight">
          Build Your Avatar
        </h1>
        <p className="text-center text-[#888] text-base sm:text-lg max-w-xl mx-auto mb-12 md:mb-16">
          Mix a color, a pair of eyes, a mouth, and a hat. Thousands of
          combinations, all yours to swap any time.
        </p>

        <AvatarMaker />
      </div>
    </div>
  );
}
