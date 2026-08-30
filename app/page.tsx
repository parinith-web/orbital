"use client";
import { useScroll, useTransform } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Navbar,
  Hero,
  Privacy,
  GoodStuff,
  BeautifullyCrafted,
  BasicsCovered,
  Theming,
  CTA,
  Footer,
} from "@/components/landing";
import { ROUTES } from "@/lib/constants/routes";

export default function Page() {
  const router = useRouter();
  const [colorDialog, setColorDialog] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Signed-in visitors land straight in the app; signed-out visitors are
  // bounced to /login by the proxy (clerkMiddleware), since /orbital is a
  // protected route — same behavior the rest of the app already relies on.
  const handleEnter = () => {
    router.push(ROUTES.ORBITAL);
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const beautifullyCraftedRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: beautifullyCraftedRef,
    offset: ["start end", "end start"],
  });

  const beautifullyCraftedOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.45, 0.75, 1],
    [0, 1, 1, 0],
  );
  const beautifullyCraftedBlur = useTransform(
    scrollYProgress,
    [0.1, 0.45, 0.75, 1],
    ["blur(12px)", "blur(0px)", "blur(0px)", "blur(12px)"],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Hero is a full `min-h-screen` section, so once we've scrolled past
      // ~85% of the viewport height we're effectively past it.
      setScrolled(container.scrollTop > window.innerHeight * 0.85);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-screen selection:bg-white/10 bg-[#0a080b] overflow-y-auto overflow-x-hidden relative"
    >
      <div ref={contentRef} className="w-full">
        {/* Comic-book stage spotlight + halftone texture standing in for
            what used to be a pixel-particle field — a static, punchy
            arcade backdrop instead of a dot-matrix simulation. */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 60% at 65% 20%, rgba(46,111,242,0.35), transparent 60%), radial-gradient(ellipse 60% 50% at 15% 70%, rgba(255,61,138,0.25), transparent 65%)",
            }}
          />
          <div className="halftone absolute inset-0 opacity-[0.06]" />
        </div>

        <Navbar scrolled={scrolled} handleEnter={handleEnter} />

        <Hero handleEnter={handleEnter} />
      </div>

      <Privacy />

      <GoodStuff />

      <BeautifullyCrafted
        beautifullyCraftedRef={beautifullyCraftedRef}
        beautifullyCraftedOpacity={beautifullyCraftedOpacity}
        beautifullyCraftedBlur={beautifullyCraftedBlur}
      />

      <BasicsCovered />

      <Theming colorDialog={colorDialog} setColorDialog={setColorDialog} />

      <CTA handleEnter={handleEnter} />

      <Footer />
    </div>
  );
}
