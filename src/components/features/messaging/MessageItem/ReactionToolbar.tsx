import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { ChatEmojiPicker } from "../EmojiPicker";
import { TooltipWrapper } from "@/components/ui/tooltip";

interface ReactionToolbarProps {
  onSelect: (emoji: string) => void;
  className?: string;
}

const QUICK_REACTIONS = ["👍", "😂", "❤️", "😭"];

export const ReactionToolbar = ({
  onSelect,
  className,
}: ReactionToolbarProps) => {
  return (
    <div
      className={`flex items-center gap-1 bg-theme-base border border-theme-border rounded-[8px] p-0.5 shadow-xl animate-in fade-in duration-400 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="w-7 h-7 flex items-center justify-center hover:bg-theme-hover rounded-[6px] transition-all hover:scale-110 text-md"
        >
          {emoji}
        </button>
      ))}

      <div className="reaction-picker-wrapper">
        <ChatEmojiPicker
          onEmojiSelect={(emojiData) => onSelect(emojiData.emoji)}
          side="top"
          align="start"
          sideOffset={10}
          alignOffset={-130}
          trigger={
            <TooltipWrapper content="Open Emoji Picker">
              <button className="p-1.5 hover:bg-theme-hover rounded-[6px] transition-colors text-gray-400 hover:text-white">
                <HugeiconsIcon icon={Add01Icon} className="w-4 h-4" />
              </button>
            </TooltipWrapper>
          }
        />
      </div>
    </div>
  );
};
