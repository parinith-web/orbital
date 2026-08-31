"use client";

import Image from "next/image";

/**
 * Decorative stand-in for a chat bubble, used only in landing-page
 * previews. Mirrors the real MessageItem's alignment rules: pass
 * `isCurrentUser` to render the bubble as "you" sent it — avatar and
 * meta flip to the right, and the bubble picks up the same
 * accent-tinted, top-right-square treatment the live chat uses for the
 * signed-in user's own messages, instead of every preview bubble being
 * left-aligned regardless of who's speaking.
 */
export const ChatMessageMock = ({
  name = "Sam",
  avatar = "/assets/ch.png",
  message = "Hey! Have you seen the new design?",
  secondMessage,
  className,
  showDate = true,
  isCurrentUser = false,
}: {
  name?: string;
  avatar?: string;
  message?: string;
  secondMessage?: string;
  className?: string;
  showDate?: boolean;
  isCurrentUser?: boolean;
}) => (
  <div className={`w-full overflow-hidden pb-4 text-left ${className}`}>
    {showDate && (
      <div className="flex items-center justify-center py-4 px-4 md:px-10">
        <span className="px-4 py-1 rounded-full bg-theme-border text-xs text-gray-300">
          26 April 2026
        </span>
      </div>
    )}

    {/* Primary Message */}
    <div className="px-4 md:px-10 transition-colors hover:bg-theme-border duration-200">
      <div
        className={`flex gap-2 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <Image
          src={avatar}
          width={40}
          height={40}
          alt=""
          className="w-10 h-10 rounded-[12px] flex-shrink-0"
        />
        <div
          className={`flex flex-col min-w-0 overflow-hidden ${isCurrentUser ? "items-end" : "items-start"}`}
        >
          <div
            className={`flex items-center gap-1 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
          >
            <span
              className={`text-xs font-medium ${isCurrentUser ? "text-theme-accent" : "text-gray-400"}`}
            >
              {isCurrentUser ? "You" : name}
            </span>
            <span className="text-[10px] text-gray-500">10:05 AM</span>
          </div>
          <div
            className={`text-sm text-white mt-1 px-3 py-1.5 max-w-[220px] ${
              isCurrentUser
                ? "rounded-xl rounded-tr-none border border-theme-accent/30 bg-theme-accent/10 text-right"
                : "rounded-xl rounded-tl-none bg-theme-hover text-left"
            }`}
          >
            {message}
          </div>
        </div>
      </div>
    </div>

    {/* Optional Second Message (without meta) */}
    {secondMessage && (
      <div className="px-4 md:px-10 transition-colors hover:bg-theme-border duration-200">
        <div
          className={`flex gap-2 ${isCurrentUser ? "flex-row-reverse" : "flex-row"}`}
        >
          <div className="w-10 flex-shrink-0" />
          <div
            className={`text-sm text-white px-3 py-1.5 max-w-[220px] ${
              isCurrentUser
                ? "rounded-xl rounded-tr-none border border-theme-accent/30 bg-theme-accent/10 text-right"
                : "rounded-xl rounded-tl-none bg-theme-hover text-left"
            }`}
          >
            {secondMessage}
          </div>
        </div>
      </div>
    )}
  </div>
);
