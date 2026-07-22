"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, BubbleChatIcon, Menu01Icon } from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import RoomChatUI from "./RoomChatUI";

/**
 * Session 3 (layout restructure scaffold) — right column of the new
 * 3-column room layout (`CallPanel | GameStage | ChatPanel`, mirroring the
 * Anomaly mockup's `CallPanel / GameStage / ChatPanel` order).
 *
 * INTENTIONAL DEVIATION FROM THE MOCKUP: the mockup itself stacks all
 * three columns vertically below `lg`. Here, only `ChatPanel` keeps the
 * slide-in drawer treatment the old combined panel used on mobile
 * (`rightMobileMenu` in `uiStore`) — `CallPanel` now stacks inline instead.
 * Stacking video tiles + game + chat all vertically on a phone would bury
 * the game itself under call tiles, so chat (the least time-critical of
 * the three on a small screen) stays tucked behind a toggle instead.
 * Flagging this clearly in case the literal stacked mockup layout is
 * preferred after all.
 *
 * Session 6 (ChatPanel + Leaderboard port) — added the persistent header
 * the scaffold was missing. The mockup's `ChatPanel` shows a
 * `BubbleChatIcon` + "Session Chat" title + kebab on every breakpoint;
 * the scaffold only ever rendered a bare "Chat" strip, and only on
 * mobile (`lg:hidden`), so desktop had no header at all. This mirrors
 * `CallPanel.tsx`'s `RoomIdentityHeader` height/border convention
 * (`h-14`, `border-b border-theme-border`) so the two flanking columns
 * read as a matched pair. The kebab is inert for now — the mockup's is
 * too (no menu wired up in the reference) — kept as a visual anchor
 * rather than invented functionality; flagging in case a real menu
 * (e.g. mute notifications) is wanted later. Mobile keeps its own close
 * (✕) button alongside it, same as before.
 */
export function ChatPanel({
  room_id,
  className = "",
}: {
  room_id: string;
  className?: string;
}) {
  const { rightMobileMenu, setRightMobileMenu } = useUIStore();

  return (
    <div
      className={`bg-theme-surface flex flex-col h-full overflow-hidden border-theme-border
      text-white select-none
      transition-transform duration-300 ease-in-out
      fixed top-0 right-0 z-[99] w-full max-w-sm
      lg:translate-y-0 translate-y-12
      ${rightMobileMenu ? "translate-x-0" : "translate-x-full"}
      lg:static lg:translate-x-0 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 px-4 h-14 border-b border-theme-border shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <HugeiconsIcon icon={BubbleChatIcon} className="w-4 h-4 text-theme-accent shrink-0" />
          <span className="truncate text-xs font-semibold tracking-wide text-white">
            Anomaly Chat
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button className="w-8 h-8 cursor-pointer flex items-center justify-center hover:bg-theme-hover rounded-[12px]">
            <HugeiconsIcon
              icon={Menu01Icon}
              className="w-4 h-4 text-white/90 hover:text-gray-200 cursor-pointer"
            />
          </button>
          <button
            onClick={() => setRightMobileMenu(false)}
            className="w-8 h-8 lg:hidden flex items-center justify-center hover:bg-theme-hover rounded-[12px]"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4 text-white/70" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <RoomChatUI room_id={room_id} />
      </div>
    </div>
  );
}
