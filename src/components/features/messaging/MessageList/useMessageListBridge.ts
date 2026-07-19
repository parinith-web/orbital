import { useEffect, useLayoutEffect, useMemo, useCallback, useRef } from "react";
import { useUIStore } from "@/store/uiStore";
import type { User } from "@/lib/types";


// Types for parameters (imported directly from usage file)
export interface UseMessageListBridgeParams {
  messageWindow: ReturnType<typeof import("@/hooks/useMessageWindow").useMessageWindow>;
  scrollManager: ReturnType<typeof import("@/hooks/useScrollManager").useScrollManager>;
  user: User | null;
  returnToLiveTrigger: number;
}

export function useMessageListBridge({
  messageWindow,
  scrollManager,
  user,
  returnToLiveTrigger,
}: UseMessageListBridgeParams) {
  // ── Scroll anchoring after older messages are prepended ───────────────
  // This useLayoutEffect fires synchronously after React updates the DOM
  // but before the browser paints, preventing any visible scroll jump.
  const previousMessageCountRef = useRef(messageWindow.messages.length);
  const previousOldestIdRef = useRef<string | null>(
    messageWindow.messages[0]?._id ?? null,
  );
  const previousOldestTimeRef = useRef<number>(
    messageWindow.messages[0]?._creationTime ?? Infinity,
  );

  useLayoutEffect(() => {
    const currentOldestMessage = messageWindow.messages[0];
    const currentOldestId = currentOldestMessage?._id ?? null;
    const currentOldestTime =
      currentOldestMessage?._creationTime ?? Infinity;
    const currentLength = messageWindow.messages.length;

    // Detect prepending by checking if the oldest message got older (smaller creationTime)
    // AND the oldest message ID changed. This is robust against window capping where
    // the array length stays constant at MAX_WINDOW_SIZE.
    const oldestGotOlder = currentOldestTime < previousOldestTimeRef.current;
    const oldestIdChanged = currentOldestId !== previousOldestIdRef.current;
    const wasPrepeneded = previousOldestIdRef.current !== null && oldestGotOlder && oldestIdChanged;

    if (wasPrepeneded) {
      scrollManager.restoreScrollAnchor();
    }

    previousMessageCountRef.current = currentLength;
    previousOldestIdRef.current = currentOldestId;
    previousOldestTimeRef.current = currentOldestTime;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageWindow.messages]);

  // ── Auto-scroll on new messages in LIVE mode ──────────────────────────
  // Only scrolls when a genuinely NEW message arrives (tracked by ID),
  // not on every re-render. This prevents the scroll-to-bottom from
  // fighting the user's manual upward scroll.
  const lastRenderedMessageIdRef = useRef<string | null>(null);
  const chatOpenTimeRef = useRef(Date.now());

  useLayoutEffect(() => {
    if (messageWindow.mode !== "LIVE") return;
    
    if (messageWindow.messages.length === 0) {
      lastRenderedMessageIdRef.current = null;
      chatOpenTimeRef.current = Date.now();
      return;
    }

    const lastMessage =
      messageWindow.messages[messageWindow.messages.length - 1];
    const lastMessageId = lastMessage._id;

    // Skip if this is the same message we already handled
    if (lastMessageId === lastRenderedMessageIdRef.current) return;
    
    // Treat any load within the first 250ms as an initial load.
    // This catches scenarios where cached messages load instantly, 
    // followed milliseconds later by live messages, preventing a "smooth" jitter.
    const isInitialLoad = Date.now() - chatOpenTimeRef.current < 250;
    lastRenderedMessageIdRef.current = lastMessageId;

    const sentByCurrentUser = lastMessage.sender_id === user?.user_id;

    // Auto-scroll if the user sent the message OR is already near bottom
    if (sentByCurrentUser || scrollManager.isNearBottomRef.current) {
      scrollManager.scrollToBottom(isInitialLoad ? "instant" : "smooth");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageWindow.messages, messageWindow.mode, user?.user_id]);

  // ── Handle search bar jump-to-message via UI store ─────────────────────
  // The search bar in TopBar sets jumpedMessageId in the UI store.
  // We need to trigger the full jumpToMessage flow (fetch window + scroll).
  const { jumpedMessageId, setJumpedMessageId } = useUIStore();

  useEffect(() => {
    if (!jumpedMessageId) return;

    messageWindow.jumpToMessage(jumpedMessageId);
    // Clear the store value so subsequent searches with the same ID still work
    setJumpedMessageId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jumpedMessageId]);

  // ── Scroll to target after jump-to-message ────────────────────────────
  useEffect(() => {
    if (!messageWindow.highlightedMessageId) return;
    if (messageWindow.mode === "JUMPING") return;

    // Small delay to let messages render before scrolling to the target
    const scrollDelay = setTimeout(() => {
      scrollManager.scrollToMessage(messageWindow.highlightedMessageId!);
    }, 50);

    return () => clearTimeout(scrollDelay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageWindow.highlightedMessageId, messageWindow.mode]);

  // ── External return-to-live trigger (from ChatInputBar send) ──────────
  useEffect(() => {
    if (returnToLiveTrigger === 0) return;
    messageWindow.returnToLive();
    // Delay scroll to allow live messages to render
    setTimeout(() => scrollManager.scrollToBottom("instant"), 100);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnToLiveTrigger]);

  // ── Media preview handler ─────────────────────────────────────────────
  const { openLightbox } = useUIStore();

  const mediaItems = useMemo(
    () =>
      messageWindow.messages
        .filter(
          (message) =>
            (message.type?.startsWith("image/") ||
              message.type?.startsWith("video/")) &&
            message.file_url,
        )
        .map((message) => ({
          file_url: message.file_url as string,
          type: message.type as string,
          file_name: message.file_name,
        })),
    [messageWindow.messages],
  );

  const handlePreviewMedia = useCallback(
    (url: string) => {
      const index = mediaItems.findIndex(
        (item: { file_url: string }) => item.file_url === url,
      );
      openLightbox(mediaItems, index >= 0 ? index : 0);
    },
    [mediaItems, openLightbox],
  );

  // ── Badge button handler ──────────────────────────────────────────────

  const handleBadgeClick = useCallback(() => {
    messageWindow.returnToLive();
    setTimeout(() => scrollManager.scrollToBottom("instant"), 100);
  }, [messageWindow, scrollManager]);

  const handleScrollDownClick = useCallback(() => {
    scrollManager.scrollToBottom();
  }, [scrollManager]);

  return {
    handlePreviewMedia,
    handleBadgeClick,
    handleScrollDownClick,
  } as const;
}
