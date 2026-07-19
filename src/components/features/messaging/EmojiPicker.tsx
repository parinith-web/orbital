import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import EmojiPicker, { Theme, EmojiStyle } from "emoji-picker-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Happy01Icon } from "@hugeicons/core-free-icons";
import { TooltipWrapper } from "@/components/ui/tooltip";


interface ChatEmojiPickerProps {
  onEmojiSelect: (emoji: any) => void;
  disabled?: boolean;
  inputRef?: React.RefObject<HTMLTextAreaElement | HTMLInputElement | null>;
  trigger?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  sideOffset?: number;
  alignOffset?: number;
}

export function ChatEmojiPicker({
  onEmojiSelect,
  disabled,
  inputRef,
  trigger,
  side = "top",
  align = "start",
  sideOffset = 60,
  alignOffset = 0,
}: ChatEmojiPickerProps) {
  return (
    <Popover.Root>

      <TooltipWrapper content={trigger ? null : "Add emoji"}>
        <Popover.Trigger asChild>
          {trigger || (
            <button
              className="border border-theme-border py-2 px-2 rounded-[12px] text-white hover:bg-theme-border disabled:opacity-50"
              disabled={disabled}
            >
              <HugeiconsIcon
                icon={Happy01Icon}
                className="text-gray-400 w-4 h-4"
              />
            </button>
          )}
        </Popover.Trigger>
      </TooltipWrapper>


      <Popover.Portal>
        <Popover.Content
          side={side}
          align={align}
          sideOffset={sideOffset}
          alignOffset={alignOffset}
          className="z-[9999] pointer-events-auto animate-in fade-in duration-200"

          onPointerDownOutside={(e) => {
            if (inputRef?.current && e.target === inputRef.current) {
              e.preventDefault();
            }
          }}
          onFocusOutside={(e) => {
            if (inputRef?.current && e.target === inputRef.current) {
              e.preventDefault();
            }
          }}
        >
          <div className="rounded-xl overflow-hidden border border-theme-border shadow-2xl">
            <EmojiPicker
              onEmojiClick={(emojiData) => {
                onEmojiSelect(emojiData);
              }}
              theme={Theme.DARK}
              emojiStyle={EmojiStyle.NATIVE}
              lazyLoadEmojis={true}
              skinTonesDisabled
              searchPlaceHolder="Search emojis..."
              height={400}
              width={320}
              previewConfig={{ showPreview: false }}
            />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
