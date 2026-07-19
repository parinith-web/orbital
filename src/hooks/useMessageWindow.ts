"use client";

/**
 * useMessageWindow — owns the message array, mode state machine, pagination logic,
 * window capping, new-message buffering, and per-channel anchor persistence.
 *
 * Does NOT own: DOM scroll position, scroll events, or any refs to DOM elements.
 * Those concerns belong to useScrollManager.
 *
 * Expects the caller (MessageList) to:
 *   - Call loadOlderMessages / loadNewerMessages in response to scroll events
 *   - Call jumpToMessage when the user navigates from search
 *   - Call returnToLive when the user clicks the "new messages" badge
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { MessageWithSender, WindowMode } from "@/lib/types";
import { PAGINATION_CONFIG } from "@/lib/constants/config";

const CONFIG = PAGINATION_CONFIG;

interface ChannelAnchor {
  messageId: string;
  creationTime: number;
}

export function useMessageWindow(
  conversationId: string,
  initialMessageId?: string,
) {
  const [mode, setMode] = useState<WindowMode>("LIVE");
  const [historyMessages, setHistoryMessages] = useState<MessageWithSender[]>(
    [],
  );
  const [lastSeenCreationTime, setLastSeenCreationTime] = useState<number>(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isLoadingNewer, setIsLoadingNewer] = useState(false);
  const [canLoadOlder, setCanLoadOlder] = useState(true);
  const [canLoadNewer, setCanLoadNewer] = useState(false);

  // ── Refs ──────────────────────────────────────────
  // Using refs for fetch guards prevents re-renders and avoids race conditions
  // where a state update hasn't propagated before the next scroll event fires
  const isFetchingRef = useRef(false);
  const channelAnchorsRef = useRef<Map<string, ChannelAnchor>>(new Map());
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousConversationIdRef = useRef(conversationId);
  const messagesRef = useRef<MessageWithSender[]>([]);
  const modeRef = useRef<WindowMode>(mode);

  // Keep refs in sync with state so callbacks always see current values
  modeRef.current = mode;

  // ── Convex client for imperative (non-reactive) queries ─────────────────
  const convexClient = useConvex();

  // ── Reactive subscription — always active ───────────────────────────────
  // In LIVE mode: these ARE the displayed messages.
  // In HISTORY mode: used only to detect new arrivals for the badge.
  // We cannot conditionally call hooks, so this subscription always runs.
  const liveQueryResult = useQuery(api.messages.subscribeLive, {
    conversation_id: conversationId,
    limit: CONFIG.messagesPerPage,
  });

  const liveMessages = useMemo(() => {
    if (!liveQueryResult) return [];
    return liveQueryResult as MessageWithSender[];
  }, [liveQueryResult]);

  // ── Derived: which messages to display ──────────────────────────────────

  const messages = mode === "LIVE" ? liveMessages : historyMessages;
  messagesRef.current = messages;

  const isInitialLoading = mode === "LIVE" && liveQueryResult === undefined;

  // ── Derived: newArrivalCount for badge ─────────────────────────────────────
  // In HISTORY mode, count how many messages in the live subscription are newer
  // than the timestamp when the user left LIVE. Caps at 50 since subscribeLive
  // only returns the latest page.
  const newArrivalCount = useMemo(() => {
    if (mode !== "HISTORY" || !liveMessages.length || !lastSeenCreationTime) {
      return 0;
    }
    return liveMessages.filter(
      (message) => message._creationTime > lastSeenCreationTime,
    ).length;
  }, [mode, liveMessages, lastSeenCreationTime]);

  // ── Window capping ──────────────────────────────────────────────────────

  function capWindowFromEnd(
    messageList: MessageWithSender[],
    evictFrom: "start" | "end",
  ): MessageWithSender[] {
    if (messageList.length <= CONFIG.maxWindowSize) {
      return messageList;
    }
    if (evictFrom === "start") {
      return messageList.slice(messageList.length - CONFIG.maxWindowSize);
    }
    return messageList.slice(0, CONFIG.maxWindowSize);
  }

  // ── Transition: LIVE → HISTORY ──────────────────────────────────────────

  const enterHistoryMode = useCallback(() => {
    if (modeRef.current !== "LIVE") return;

    const currentMessages = messagesRef.current;
    setHistoryMessages(currentMessages);

    // Record when the user left LIVE so we can count new arrivals
    const newestCreationTime =
      currentMessages[currentMessages.length - 1]?._creationTime ?? Date.now();
    setLastSeenCreationTime(newestCreationTime);

    setMode("HISTORY");
    setCanLoadNewer(true);
    setCanLoadOlder(true);
  }, []);

  // ── Action: load older messages (backward pagination) ───────────────────

  const loadOlderMessages = useCallback(async () => {
    if (isFetchingRef.current || !canLoadOlder) return;

    // Auto-transition from LIVE to HISTORY on first upward fetch
    if (modeRef.current === "LIVE") {
      enterHistoryMode();
    }

    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) return;

    const oldestMessage = currentMessages[0];

    isFetchingRef.current = true;
    setIsLoadingOlder(true);

    try {
      const olderMessages = (await convexClient.query(api.messages.getBefore, {
        conversation_id: conversationId,
        before_creation_time: oldestMessage._creationTime,
        limit: CONFIG.messagesPerPage,
      })) as MessageWithSender[];

      if (olderMessages.length < CONFIG.messagesPerPage) {
        setCanLoadOlder(false);
      }

      if (olderMessages.length > 0) {
        setHistoryMessages((previous) => {
          const combined = [...olderMessages, ...previous];
          // Evict from the END (newest) when prepending older messages
          return capWindowFromEnd(combined, "end");
        });
      }
    } catch (error) {
      console.error("[useMessageWindow] Failed to load older messages:", error);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingOlder(false);
    }
  }, [canLoadOlder, conversationId, convexClient, enterHistoryMode]);

  // ── Action: load newer messages (forward pagination / catch-up) ─────────

  const loadNewerMessages = useCallback(async () => {
    if (isFetchingRef.current || modeRef.current !== "HISTORY") return;

    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) return;

    const newestMessage = currentMessages[currentMessages.length - 1];

    isFetchingRef.current = true;
    setIsLoadingNewer(true);

    try {
      const newerMessages = (await convexClient.query(api.messages.getAfter, {
        conversation_id: conversationId,
        after_creation_time: newestMessage._creationTime,
        limit: CONFIG.messagesPerPage,
      })) as MessageWithSender[];

      if (newerMessages.length < CONFIG.messagesPerPage) {
        // Caught up to the live edge — transition back to LIVE
        setMode("LIVE");
        setCanLoadNewer(false);
        setCanLoadOlder(true); // Reset so user can scroll up again
        setLastSeenCreationTime(0);
      }

      if (newerMessages.length > 0) {
        setHistoryMessages((previous) => {
          const combined = [...previous, ...newerMessages];
          // Evict from the START (oldest) when appending newer messages
          return capWindowFromEnd(combined, "start");
        });
      }
    } catch (error) {
      console.error("[useMessageWindow] Failed to load newer messages:", error);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingNewer(false);
    }
  }, [conversationId, convexClient]);

  // ── Action: jump to a specific message ──────────────────────────────────

  const jumpToMessage = useCallback(
    async (messageId: string) => {
      setMode("JUMPING");
      setIsLoadingOlder(false);
      setIsLoadingNewer(false);

      try {
        const result = await convexClient.query(api.messages.getAround, {
          conversation_id: conversationId,
          target_message_id: messageId as Id<"messages">,
          half_limit: Math.floor(CONFIG.messagesPerPage / 2),
        });

        const aroundMessages = result.messages as MessageWithSender[];

        if (aroundMessages.length === 0) {
          console.error(
            "[useMessageWindow] jumpToMessage: target message not found:",
            messageId,
          );
          setMode("LIVE");
          return;
        }

        setHistoryMessages(aroundMessages);
        setCanLoadOlder(result.targetIndex > 0);
        setCanLoadNewer(true);

        // Record the live edge timestamp for badge counting
        const latestLiveMessage = liveMessages[liveMessages.length - 1];
        setLastSeenCreationTime(latestLiveMessage?._creationTime ?? Date.now());

        setMode("HISTORY");

        // Clear any previous highlight timer before starting a new one
        if (highlightTimerRef.current) {
          clearTimeout(highlightTimerRef.current);
        }
        setHighlightedMessageId(messageId);
        highlightTimerRef.current = setTimeout(() => {
          setHighlightedMessageId(null);
          highlightTimerRef.current = null;
        }, CONFIG.highlightDurationMs);
      } catch (error) {
        console.error("[useMessageWindow] jumpToMessage failed:", error);
        setMode("LIVE");
      }
    },
    [conversationId, convexClient, liveMessages],
  );

  // ── Action: return to live mode ─────────────────────────────────────────

  const returnToLive = useCallback(() => {
    setMode("LIVE");
    setHistoryMessages([]);
    setCanLoadNewer(false);
    setCanLoadOlder(true); // Reset so user can scroll up again
    setLastSeenCreationTime(0);
  }, []);

  // ── Channel switching: save/restore scroll anchor ───────────────────────

  useEffect(() => {
    const previousId = previousConversationIdRef.current;
    if (previousId === conversationId) return;

    // Save anchor for the channel we're leaving
    const previousMessages = messagesRef.current;
    if (modeRef.current !== "LIVE" && previousMessages.length > 0) {
      const anchorIndex = Math.floor(previousMessages.length / 2);
      const anchorMessage = previousMessages[anchorIndex];
      channelAnchorsRef.current.set(previousId, {
        messageId: anchorMessage._id,
        creationTime: anchorMessage._creationTime,
      });
    }

    previousConversationIdRef.current = conversationId;

    // Check for saved anchor on the new channel
    const savedAnchor = channelAnchorsRef.current.get(conversationId);
    if (savedAnchor) {
      channelAnchorsRef.current.delete(conversationId);
      // Use setTimeout to ensure the convex subscription has initialized
      // before we try to jump (avoids racing the query connection)
      setTimeout(() => jumpToMessage(savedAnchor.messageId), 0);
    } else {
      // Fresh start
      setMode("LIVE");
      setHistoryMessages([]);
      setCanLoadOlder(true);
      setCanLoadNewer(false);
      setLastSeenCreationTime(0);
      setHighlightedMessageId(null);
    }
  }, [conversationId, jumpToMessage]);

  // ── Initial jump-to-message (from search or linked message) ─────────────

  useEffect(() => {
    if (initialMessageId) {
      jumpToMessage(initialMessageId);
    }
  }, [initialMessageId, jumpToMessage]);

  // ── Cleanup highlight timers on unmount ─────────────────────────────────

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, []);

  // ── Public API ──────────────────────────────────────────────────────────

  return {
    // message data
    messages,
    mode,
    newArrivalCount,
    highlightedMessageId,
    isInitialLoading,

    // actions
    loadOlderMessages,
    loadNewerMessages,
    jumpToMessage,
    returnToLive,
    enterHistoryMode,

    // flags
    isLoadingOlder,
    isLoadingNewer,
    canLoadOlder,
    canLoadNewer,
  };
}
