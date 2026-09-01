"use client";

import { useEffect, useRef, useState } from "react";

interface CategoryCarouselProps {
  children: React.ReactNode;
  /** Unique key for the current category — used to reset scroll position
   * when the user switches tabs, so "Eyes" doesn't open mid-scroll just
   * because "Hat" was scrolled right earlier. */
  resetKey: string;
}

/**
 * A single horizontal row of option tiles with scroll-snap and prev/next
 * arrows, so a whole category (color, eyes, mouth, hat) fits in one
 * scrollable strip instead of wrapping into several rows of vertical page
 * length.
 */
export function CategoryCarousel({ children, resetKey }: CategoryCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    scrollerRef.current?.scrollTo({ left: 0 });
    // Arrow visibility depends on content width, which just changed.
    requestAnimationFrame(updateArrows);
  }, [resetKey]);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scrollByAmount = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-[#0f0f0f]/90 border border-white/15 flex items-center justify-center text-white hover:bg-[#0f0f0f] transition-colors -translate-x-1/3"
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        className="flex gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth px-1 py-1"
      >
        {children}
      </div>

      {canScrollRight && (
        <button
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-9 w-9 rounded-full bg-[#0f0f0f]/90 border border-white/15 flex items-center justify-center text-white hover:bg-[#0f0f0f] transition-colors translate-x-1/3"
        >
          <ChevronIcon direction="right" />
        </button>
      )}

      {/* Edge fades hint that the row scrolls, without relying only on arrows */}
      {canScrollLeft && (
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0f0f0f] to-transparent" />
      )}
      {canScrollRight && (
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0f0f0f] to-transparent" />
      )}
    </div>
  );
}

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d={direction === "left" ? "M10 3L5 8l5 5" : "M6 3l5 5-5 5"}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default CategoryCarousel;
