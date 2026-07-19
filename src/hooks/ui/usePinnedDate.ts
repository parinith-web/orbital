import { useEffect, useRef, useCallback } from "react";
import { formatDateFull } from "@/lib/utils/date";
import type { MessageWithSender } from "@/lib/types";

interface UsePinnedDateProps {
  messages: MessageWithSender[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  viewportRef: React.RefObject<HTMLDivElement | null>;
  pinnedHeaderRef: React.RefObject<HTMLDivElement | null>;
  headerHeight?: number;
}

export function usePinnedDate({
  messages,
  containerRef,
  viewportRef,
  pinnedHeaderRef,
  headerHeight = 44,
}: UsePinnedDateProps) {
  const lastActiveDateRef = useRef<string | null>(null);
  const rafRef = useRef<number | null>(null);

  const handleScroll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const scroller = containerRef.current;
      const viewport = viewportRef.current;
      const pinnedHeader = pinnedHeaderRef.current;
      if (!scroller || !viewport || !messages.length) return;

      const viewportTop = viewport.getBoundingClientRect().top;
      const items = scroller.querySelectorAll("[data-index]");
      
      // 1. Identify the active date section based on scroll position
      let activeIndex = -1;
      let activeItemRect: DOMRect | null = null;

      for (let i = 0; i < items.length; i++) {
        const item = items[i] as HTMLElement;
        const rect = item.getBoundingClientRect();
        
        // We consider an item "active" if its content has reached the sticky header line (5px)
        if (rect.bottom - viewportTop > 5) {
          activeIndex = parseInt(item.getAttribute("data-index") || "-1");
          activeItemRect = rect;
          break;
        }
      }

      // 2. Visibility Logic: Hide sticky header if at the extreme start
      let isVisible = true;

      if (activeIndex === 0 && activeItemRect) {
        const relativeTop = activeItemRect.top - viewportTop;

        if (relativeTop >= 0) isVisible = false;
      }

      let newDate: string | null = null;
      if (isVisible && activeIndex !== -1 && messages[activeIndex]) {
        newDate = formatDateFull(messages[activeIndex]._creationTime);
      }

      // 3. Update DOM directly for zero-lag performance
      if (pinnedHeader) {
        // Update text content only when changed
        if (newDate !== lastActiveDateRef.current) {
          lastActiveDateRef.current = newDate;
          const textElement = pinnedHeader.querySelector("span");
          if (textElement) {
             textElement.textContent = newDate || "";
          }
        }

        // Calculate the push effect from upcoming headers
        const headers = scroller.querySelectorAll('[data-date-header="true"]');
        let newTranslateY = 0;

        for (let i = 0; i < headers.length; i++) {
          const header = headers[i] as HTMLElement;
          const rect = header.getBoundingClientRect();
          const relativeTop = rect.top - viewportTop;

          if (relativeTop > 0 && relativeTop < headerHeight) {
            newTranslateY = relativeTop - headerHeight;
            break;
          }
        }

        pinnedHeader.style.transform = `translateY(${newTranslateY}px)`;
        pinnedHeader.style.opacity = "1";
        pinnedHeader.style.visibility = (isVisible && newDate) ? "visible" : "hidden";
      }
    });
  }, [containerRef, viewportRef, pinnedHeaderRef, headerHeight, messages]);

  useEffect(() => {
    const scroller = containerRef.current;
    if (!scroller) return;

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [containerRef, handleScroll]);

  return {};
}
