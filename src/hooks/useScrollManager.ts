"use client";

/**
 * useScrollManager — owns all DOM scroll concerns: scroll container ref,
 * position tracking, near-top / near-bottom detection, scroll anchoring
 * when messages are prepended, auto-scroll, and scroll-to-message.
 *
 * Does NOT own: message data, fetch decisions, or mode state.
 * Those concerns belong to useMessageWindow.
 *
 * Expects the caller (MessageList) to:
 *   - Attach `scrollContainerRef` to the scrollable div
 *   - Attach `bottomAnchorRef` to a sentinel div at the bottom
 *   - Call `saveScrollAnchor()` before any prepend operation
 *   - Call `restoreScrollAnchor()` in a useLayoutEffect after prepend re-renders
 */

import { useCallback, useRef, useState } from "react";
import { SCROLL_CONFIG } from "@/lib/constants/config";
import type {
  SavedScrollAnchor,
  UseScrollManagerOptions,
} from "@/lib/types/message";

const CONFIG = SCROLL_CONFIG;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useScrollManager(options: UseScrollManagerOptions = {}) {
  const { onNearTop, onNearBottom } = options;

  // ── Refs ────────────────────────────────────────────────────────────────
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const bottomAnchorRef = useRef<HTMLDivElement>(null);
  const savedAnchorRef = useRef<SavedScrollAnchor | null>(null);

  // Suppresses scroll-triggered callbacks during programmatic scrolls (e.g.,
  // scrollToMessage) to prevent the scroll event from re-triggering fetch logic.
  const isScrollingProgrammaticallyRef = useRef(false);

  // Stores the latest callback refs so the scroll handler doesn't go stale
  const onNearTopRef = useRef(onNearTop);
  const onNearBottomRef = useRef(onNearBottom);
  onNearTopRef.current = onNearTop;
  onNearBottomRef.current = onNearBottom;

  // Debounce timers for near-top / near-bottom callbacks
  const nearTopDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const nearBottomDebounceTimerRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  // Track whether we've already fired the callback so we don't fire again until scroll moves away and back
  const hasFiredNearTopRef = useRef(false);
  const hasFiredNearBottomRef = useRef(false);

  // ── Scroll state ────────────────────────────────────────────────────────
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isNearBottomRef = useRef(true);

  // ── Scroll position helpers ─────────────────────────────────────────────

  function calculateIsNearBottom(container: HTMLElement): boolean {
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < CONFIG.nearBottomThreshold;
  }

  function calculateIsNearTop(container: HTMLElement): boolean {
    return container.scrollTop < CONFIG.nearTopThreshold;
  }

  /**
   * Finds the first message element that is visible in the viewport.
   * Returns the message ID and its offset from the top of the viewport.
   */
  function findFirstVisibleMessage(container: HTMLElement): {
    messageId: string | null;
    offsetFromTop: number;
  } {
    const messageElements = container.querySelectorAll("[data-message-id]");
    const containerRect = container.getBoundingClientRect();

    for (const el of messageElements) {
      const rect = el.getBoundingClientRect();
      // Element is visible if its bottom edge is below the container's top edge
      if (rect.bottom > containerRect.top + 1) {
        return {
          messageId: el.getAttribute("data-message-id"),
          offsetFromTop: rect.top - containerRect.top,
        };
      }
    }

    return { messageId: null, offsetFromTop: 0 };
  }

  // ── Scroll event handler ────────────────────────────────────────────────

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Don't trigger callbacks during programmatic scrolls (scrollToMessage, etc.)
    if (isScrollingProgrammaticallyRef.current) return;

    const nearBottom = calculateIsNearBottom(container);
    const nearTop = calculateIsNearTop(container);

    // Only update React state when the value actually changes to avoid re-renders
    if (nearBottom !== isNearBottomRef.current) {
      isNearBottomRef.current = nearBottom;
      setIsNearBottom(nearBottom);
    }

    // Reset "has fired" flags when user scrolls away from the edge
    if (!nearTop && hasFiredNearTopRef.current) {
      hasFiredNearTopRef.current = false;
    }
    if (!nearBottom && hasFiredNearBottomRef.current) {
      hasFiredNearBottomRef.current = false;
    }

    // Debounced near-top callback
    if (nearTop && !hasFiredNearTopRef.current) {
      if (nearTopDebounceTimerRef.current) {
        clearTimeout(nearTopDebounceTimerRef.current);
      }
      nearTopDebounceTimerRef.current = setTimeout(() => {
        // Double-check we're still near top after debounce
        if (
          scrollContainerRef.current &&
          calculateIsNearTop(scrollContainerRef.current)
        ) {
          hasFiredNearTopRef.current = true;
          onNearTopRef.current?.();
        }
      }, CONFIG.scrollCallbackDebounceMs);
    }

    // Debounced near-bottom callback
    if (nearBottom && !hasFiredNearBottomRef.current) {
      if (nearBottomDebounceTimerRef.current) {
        clearTimeout(nearBottomDebounceTimerRef.current);
      }
      nearBottomDebounceTimerRef.current = setTimeout(() => {
        if (
          scrollContainerRef.current &&
          calculateIsNearBottom(scrollContainerRef.current)
        ) {
          hasFiredNearBottomRef.current = true;
          onNearBottomRef.current?.();
        }
      }, CONFIG.scrollCallbackDebounceMs);
    }
  }, []);

  // NOTE: No useEffect for addEventListener here. The caller attaches
  // handleScroll via React's onScroll prop, which guarantees the handler
  // is bound whenever the element exists in the DOM. The previous
  // useEffect approach failed because it ran once during ChatSkeleton
  // (when scrollContainerRef was null) and never re-ran.

  // ── Scroll actions ──────────────────────────────────────────────────────

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    if (behavior === "smooth") {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "smooth",
      });
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, []);

  /**
   * Scrolls a specific message into view and optionally centers it vertically.
   * Temporarily suppresses scroll callbacks to prevent the programmatic scroll
   * from triggering near-top/near-bottom fetch logic.
   */
  const scrollToMessage = useCallback((messageId: string) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const messageElement = container.querySelector(
      `[data-message-id="${messageId}"]`,
    ) as HTMLElement | null;
    if (!messageElement) return;

    isScrollingProgrammaticallyRef.current = true;

    messageElement.scrollIntoView({
      behavior: "instant",
      block: "center",
    });

    // Re-enable scroll checks after the scroll settles
    setTimeout(() => {
      isScrollingProgrammaticallyRef.current = false;
    }, CONFIG.scrollSettleDelayMs);
  }, []);

  // ── Scroll anchoring for prepend operations ─────────────────────────────
  //
  // When older messages are prepended, the scroll position would normally jump
  // because new content is added above the viewport. We compensate by recording
  // the first visible message element and its offset from the viewport top.
  // After React re-renders, we find that same message and scroll it to the same
  // offset. This is immune to async image loading because it anchors to a
  // specific element, not to scrollHeight math.
  //
  // This two-step dance (save → restore) must be coordinated by the caller:
  //   1. Call saveScrollAnchor() before triggering the fetch
  //   2. Call restoreScrollAnchor() in a useLayoutEffect after prepend re-renders

  const saveScrollAnchor = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { messageId, offsetFromTop } = findFirstVisibleMessage(container);

    savedAnchorRef.current = {
      firstVisibleMessageId: messageId,
      offsetFromTop,
      scrollTop: container.scrollTop,
      scrollHeight: container.scrollHeight,
    };
  }, []);

  const restoreScrollAnchor = useCallback(() => {
    const container = scrollContainerRef.current;
    const savedAnchor = savedAnchorRef.current;
    if (!container || !savedAnchor) return;

    // Disable smooth scrolling and native scroll anchoring during restore
    // so the adjustment is instant and invisible to the user
    const originalScrollBehavior = container.style.scrollBehavior;
    container.style.scrollBehavior = "auto";

    // Strategy 1: Element-based anchoring (preferred — immune to async content)
    if (savedAnchor.firstVisibleMessageId) {
      const messageElement = container.querySelector(
        `[data-message-id="${savedAnchor.firstVisibleMessageId}"]`,
      ) as HTMLElement | null;

      if (messageElement) {
        const containerRect = container.getBoundingClientRect();
        const messageRect = messageElement.getBoundingClientRect();
        const currentOffset = messageRect.top - containerRect.top;
        const adjustment = currentOffset - savedAnchor.offsetFromTop;

        // Only adjust if the offset has actually changed (prevents unnecessary scrolls)
        if (Math.abs(adjustment) > 1) {
          container.scrollTop += adjustment;
        }

        savedAnchorRef.current = null;
        container.style.scrollBehavior = originalScrollBehavior;
        return;
      }
    }

    // Strategy 2: Fallback to scrollHeight-based anchoring
    // (used when the anchored message was removed by window capping)
    const heightDifference = container.scrollHeight - savedAnchor.scrollHeight;
    if (heightDifference > 0) {
      container.scrollTop = savedAnchor.scrollTop + heightDifference;
    }

    savedAnchorRef.current = null;
    container.style.scrollBehavior = originalScrollBehavior;
  }, []);

  // ── Public API ──────────────────────────────────────────────────────────

  return {
    // refs — attach these to the DOM
    scrollContainerRef,
    bottomAnchorRef,

    // scroll state
    isNearBottom,
    isNearBottomRef,

    // actions
    scrollToBottom,
    scrollToMessage,
    saveScrollAnchor,
    restoreScrollAnchor,
    handleScroll,
  };
}
