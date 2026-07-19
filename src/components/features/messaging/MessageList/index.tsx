import React, { useRef, useEffect } from "react";
import { MessageItem } from "../MessageItem";
import { usePinnedDate } from "@/hooks/ui/usePinnedDate";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { useMessageWindow } from "@/hooks/useMessageWindow";
import { useScrollManager } from "@/hooks/useScrollManager";
import { cn } from "@/lib/utils";
import { LoadingDots } from "./LoadingDots";
import { TypingIndicator } from "./TypingIndicator";
import { FloatingButtons } from "./FloatingButtons";
import { MessageListProps } from "./types";
import { useMessageListBridge } from "./useMessageListBridge";

// ─── Component ────────────────────────────────────────────────────────────────

export const MessageList = React.memo(
  ({
    conversationId,
    conversationType,
    initialMessageId,
    typingUsers,
    user,
    color,
    textColor,
    onDeleteRequest,
    returnToLiveTrigger,
  }: MessageListProps) => {
    // ── Message window (data + state machine) ─────────────────────────────
    const messageWindow = useMessageWindow(conversationId, initialMessageId);

    // ── Scroll manager (DOM scroll concerns) ──────────────────────────────
    const scrollManager = useScrollManager({
      onNearTop: () => {
        if (messageWindow.canLoadOlder && !messageWindow.isLoadingOlder) {
          // Save the scroll anchor BEFORE we fetch — the restoreScrollAnchor call
          // in useLayoutEffect below will compensate after the new messages render
          scrollManager.saveScrollAnchor();
          messageWindow.loadOlderMessages();
        }
      },
      onNearBottom: () => {
        if (
          messageWindow.mode === "HISTORY" &&
          messageWindow.canLoadNewer &&
          !messageWindow.isLoadingNewer
        ) {
          messageWindow.loadNewerMessages();
        }
      },
    });

    // ── Pinned date header support ────────────────────────────────────────
    const viewportRef = useRef<HTMLDivElement>(null);
    const pinnedHeaderRef = useRef<HTMLDivElement>(null);

    usePinnedDate({
      messages: messageWindow.messages,
      containerRef: scrollManager.scrollContainerRef,
      viewportRef,
      pinnedHeaderRef,
      headerHeight: 40,
    });

    const { handlePreviewMedia, handleBadgeClick, handleScrollDownClick } =
      useMessageListBridge({
        messageWindow,
        scrollManager,
        user,
        returnToLiveTrigger,
      });

    const latestMessageId =
      messageWindow.messages.length > 0
        ? messageWindow.messages[messageWindow.messages.length - 1]._id
        : null;

    // ── Loading state ─────────────────────────────────────────────────────

    if (messageWindow.isInitialLoading && messageWindow.messages.length === 0) {
      return <ChatSkeleton />;
    }

    const showNewMessageBadge =
      messageWindow.mode === "HISTORY" && messageWindow.newArrivalCount > 0;

    const showScrollDownButton =
      !showNewMessageBadge &&
      !scrollManager.isNearBottom &&
      messageWindow.messages.length > 0;

    return (
      <div
        ref={viewportRef}
        className="flex-1 w-full relative h-full flex flex-col overflow-hidden"
      >
        {/* ── Floating bottom buttons ─────────────────────────────────── */}
        <FloatingButtons
          showNewMessageBadge={showNewMessageBadge}
          showScrollDownButton={showScrollDownButton}
          newArrivalCount={messageWindow.newArrivalCount}
          onBadgeClick={handleBadgeClick}
          onScrollDownClick={handleScrollDownClick}
        />

        {/* ── Pinned Date Header Overlay ──────────────────────────────── */}
        <div
          ref={pinnedHeaderRef}
          className="absolute top-[5px] left-0 right-0 z-20 flex items-center justify-center pointer-events-none"
          style={{ visibility: "hidden" }}
        >
          <span
            className={cn(
              "px-4 py-1 rounded-full bg-theme-border/80 backdrop-blur-md border border-theme-border text-xs text-gray-300 shadow-lg",
            )}
          ></span>
        </div>

        <div
          ref={scrollManager.scrollContainerRef}
          onScroll={scrollManager.handleScroll}
          className="flex-1 w-full overflow-y-auto"
        >
          <div className="flex flex-col min-h-full">
            {/* Spacer pushes messages to the bottom when there are few of them */}
            <div className="flex-1" />

            {messageWindow.isLoadingOlder && <LoadingDots />}

            <div className="flex flex-col py-4">
              {messageWindow.messages.map((message, index) => {
                const previousMessage =
                  index > 0 ? messageWindow.messages[index - 1] : null;
                const nextMessage =
                  index < messageWindow.messages.length - 1
                    ? messageWindow.messages[index + 1]
                    : null;

                return (
                  <div key={message._id} data-index={index}>
                    <MessageItem
                      message={message}
                      prevMessage={previousMessage}
                      nextMessage={nextMessage}
                      user={user}
                      isCurrentUser={message.sender_id === user?.user_id}
                      color={color}
                      textColor={textColor}
                      onPreviewMedia={handlePreviewMedia}
                      onDeleteRequest={onDeleteRequest}
                      highlighted={
                        message._id === messageWindow.highlightedMessageId
                      }
                    />
                  </div>
                );
              })}
            </div>

            {/* ── Bottom loading spinner (newer messages) ─────────── */}
            {messageWindow.isLoadingNewer && <LoadingDots />}

            {typingUsers.length > 0 && (
              <TypingIndicator typingUsers={typingUsers} />
            )}

            {/* Bottom sentinel — scroll target and intersection anchor */}
            <div ref={scrollManager.bottomAnchorRef} className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  },
);

MessageList.displayName = "MessageList";
