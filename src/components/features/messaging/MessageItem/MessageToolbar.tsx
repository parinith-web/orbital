import React, { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Happy01Icon,
  PencilEdit01Icon,
  MoreHorizontalIcon,
  CopyIcon,
  Delete01Icon,
} from "@hugeicons/core-free-icons";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as HoverCard from "@radix-ui/react-hover-card";
import { useToggleReaction } from "@/hooks/useToggleReaction";
import { toast } from "sonner";
import { ReactionToolbar } from "./ReactionToolbar";
import { TooltipWrapper } from "@/components/ui/tooltip";


interface MessageToolbarProps {
  content?: string | null;
  messageId: string;
  onDeleteRequest: (id: string) => void;
  onEditRequest: () => void;
  isCurrentUser: boolean;
}

export const MessageToolbar = ({
  content,
  messageId,
  onDeleteRequest,
  onEditRequest,
  isCurrentUser,
}: MessageToolbarProps) => {
  const [hoverCardOpen, setHoverCardOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleReaction = useToggleReaction();

  const handleCopy = () => {
    if (content) {
      navigator.clipboard.writeText(content);
    }
  };

  const onReactionSelect = async (emoji: string) => {
    const result = await toggleReaction(messageId, emoji);
    if (!result.success && result.error) {
      toast.error(result.error);
    }
    setHoverCardOpen(false);
  };

  return (
    <div
      className={`absolute -top-4 right-4 md:right-10 z-[70] transition-opacity flex items-center gap-0.5 bg-theme-base border border-theme-border rounded-[8px] p-0.5 shadow-lg group-hover/row:opacity-100 ${menuOpen || hoverCardOpen ? "opacity-100" : "opacity-0"}`}
    >
      <HoverCard.Root
        openDelay={100}
        closeDelay={300}
        open={hoverCardOpen}
        onOpenChange={setHoverCardOpen}
      >

        <HoverCard.Trigger asChild>
          <button
            className={`p-1.5 rounded-[6px] transition-colors ${hoverCardOpen ? "bg-theme-hover text-white" : "text-gray-400 hover:text-white hover:bg-theme-hover"}`}
          >
            <HugeiconsIcon icon={Happy01Icon} className="w-4 h-4" />
          </button>
        </HoverCard.Trigger>



        <HoverCard.Portal>
          <HoverCard.Content
            side="top"
            align="center"
            sideOffset={8}
            className="z-[100] outline-none"
          >
            <ReactionToolbar onSelect={onReactionSelect} />
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>

      {isCurrentUser && (
        <TooltipWrapper content="Edit">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditRequest();
            }}
            className="p-1.5 hover:bg-theme-hover rounded-[6px] transition-colors text-gray-400 hover:text-white"
          >
            <HugeiconsIcon icon={PencilEdit01Icon} className="w-4 h-4" />
          </button>
        </TooltipWrapper>

      )}

      {(content || isCurrentUser) && (
        <DropdownMenu.Root
          modal={false}
          open={menuOpen}
          onOpenChange={setMenuOpen}
        >

          <DropdownMenu.Trigger asChild>
            <button className="p-1.5 rounded-[6px] transition-colors hover:bg-theme-hover text-gray-400 hover:text-white">
              <HugeiconsIcon icon={MoreHorizontalIcon} className="w-4 h-4" />
            </button>
          </DropdownMenu.Trigger>



          <DropdownMenu.Portal>
            <DropdownMenu.Content
              sideOffset={8}
              align="end"
              className="w-auto min-w-[120px] pointer-events-auto bg-theme-base border border-theme-border rounded-md z-[100] animate-in fade-in duration-100 outline-none"
            >
              {content && (
                <DropdownMenu.Item
                  onClick={handleCopy}
                  className="px-3 py-2 text-xs text-gray-300 hover:bg-theme-hover flex items-center rounded-t-sm gap-2 cursor-pointer outline-none"
                >
                  <HugeiconsIcon icon={CopyIcon} className="w-3.5 h-3.5" />
                  Copy
                </DropdownMenu.Item>
              )}
              {isCurrentUser && (
                <DropdownMenu.Item
                  onClick={() => onDeleteRequest(messageId)}
                  className="px-3 py-2 text-xs text-red-300 hover:bg-theme-hover flex items-center rounded-b-sm gap-2 cursor-pointer outline-none"
                >
                  <HugeiconsIcon icon={Delete01Icon} className="w-3.5 h-3.5" />
                  Delete
                </DropdownMenu.Item>
              )}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
};
