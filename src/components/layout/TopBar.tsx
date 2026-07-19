import { useEffect, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Image01Icon,
  InformationCircleIcon,
  Menu01Icon,
  UserGroupIcon,
  CallIcon,
} from "@hugeicons/core-free-icons";
import * as Popover from "@radix-ui/react-popover";
import { formatToIST } from "@/lib/utils/date";
import { useRoomMembers, useCalls } from "@/hooks";
import { useSearchMessages } from "@/hooks";

import { useUIStore } from "@/store/uiStore";
import { useCallStore } from "@/store/callStore";
import { TooltipWrapper } from "@/components/ui/tooltip";

export default function TopBar({ room_id }: { room_id: string }) {
  const members = useRoomMembers(room_id);
  const { activeCalls } = useCalls(room_id);
  const { status: callStatus, actualRoomId } = useCallStore();
  const isInCall = callStatus === "joined";
  const [query, setQuery] = useState("");
  const { results: searchResults } = useSearchMessages({
    conversationId: room_id,
    query,
  });
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [selectedResult, setSelectedResult] = useState(0);
  const {
    toggleSidebar,
    isSidebarOpen,
    sidebarTab,
    setJumpedMessageId,
    leftMobileMenu,
    setLeftMobileMenu,
    rightMobileMenu,
    setRightMobileMenu,
  } = useUIStore();

  const handleSearchClick = (index: number, id: string, sent_at: number) => {
    setSelectedResult(index);
    setJumpedMessageId(id);
    window.dispatchEvent(
      new CustomEvent("jump-to-msg", { detail: { id, sent_at } }),
    );
    setIsSearchOpen(false);
  };

  useEffect(() => {
    document.getElementById(`result-${selectedResult}`)?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [selectedResult]);

  return (
    <div className="h-12">
      <div className="z-[60] relative text-white/60 text-sm px-3 md:px-2 w-full justify-between flex items-center gap-2 bg-theme-surface h-12 border-theme-border border-b">
        <TooltipWrapper content="Main menu" side="right">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLeftMobileMenu(!leftMobileMenu);
            }}
            className="flex-none p-1 md:hidden rounded-[8px] transition-colors"
          >
            <HugeiconsIcon
              icon={Menu01Icon}
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${leftMobileMenu ? "rotate-180" : ""}`}
            />
          </button>
        </TooltipWrapper>

        <Popover.Root open={isSearchOpen} onOpenChange={setIsSearchOpen}>
          <Popover.Trigger asChild>
            <div className="relative flex-1 md:max-w-[50%] outline-none">
              <div className="flex px-3 py-1 items-center text-gray-400 rounded-[6px] bg-theme-base overflow-hidden outline-none">
                <HugeiconsIcon
                  icon={Search01Icon}
                  className="flex-none w-4 h-4 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search messages"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setIsSearchOpen(e.target.value.length > 0);
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setSelectedResult((prev) =>
                        Math.min(prev + 1, searchResults.length - 1),
                      );
                    }
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setSelectedResult((prev) => Math.max(prev - 1, 0));
                    }
                    if (e.key === "Enter" && searchResults.length > 0) {
                      e.preventDefault();
                      const result = searchResults[selectedResult];
                      handleSearchClick(
                        selectedResult,
                        result._id,
                        result._creationTime,
                      );
                    }
                    if (e.key === "Escape") {
                      setIsSearchOpen(false);
                    }
                  }}
                  className="md:px-2 px-1 py-1 min-w-0 w-full bg-transparent outline-none placeholder-gray-400"
                />
              </div>
            </div>
          </Popover.Trigger>

          {searchResults.length > 0 && (
            <Popover.Content
              className="min-w-[280px] w-[var(--radix-popover-trigger-width)] max-h-[200px] overflow-scroll text-sm bg-theme-base rounded-[8px] p-2 z-[3000] border border-theme-border shadow-xl"
              side="bottom"
              align="start"
              sideOffset={4}
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {searchResults.map((result, index) => (
                <div
                  key={result._id}
                  id={`result-${index}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSearchClick(index, result._id, result._creationTime);
                  }}
                  className={`hover:bg-theme-hover ${selectedResult === index ? "bg-theme-hover" : ""
                    } flex items-center justify-between rounded-[6px] px-4 p-2 cursor-pointer`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white/40">
                      {result.sender?.username}:
                    </span>
                    <span className="text-white/60 max-w-[260px] font-medium">
                      {result.content}
                    </span>
                  </div>
                  <span className="text-white/40 text-xs">
                    {formatToIST(result._creationTime)}
                  </span>
                </div>
              ))}
            </Popover.Content>
          )}
        </Popover.Root>
        <div className="flex items-center flex-none md:gap-1 gap-0 ml-2">
          <TooltipWrapper content="Media Gallery">
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar("media");
              }}
              className={`flex-none w-8 select-none h-8 p-2 cursor-pointer rounded-xl flex items-center justify-center transition-colors ${isSidebarOpen && sidebarTab === "media"
                ? "bg-theme-hover"
                : "hover:bg-theme-hover"
                }`}
            >
              <HugeiconsIcon
                icon={Image01Icon}
                className={`w-4 h-4 transition-colors ${isSidebarOpen && sidebarTab === "media" ? "text-white" : "text-gray-300"}`}
              />
            </div>
          </TooltipWrapper>

          <TooltipWrapper content="Calls">
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar("calls");
              }}
              className={`flex-none w-8 select-none h-8 p-2 cursor-pointer rounded-xl flex items-center justify-center transition-colors relative ${isSidebarOpen && sidebarTab === "calls"
                ? "bg-theme-hover"
                : "hover:bg-theme-hover"
                }`}
            >
              <HugeiconsIcon
                icon={CallIcon}
                className={`w-4 h-4 transition-colors ${isSidebarOpen && sidebarTab === "calls"
                  ? "text-white"
                  : "text-gray-300"
                  }`}
              />
              {activeCalls.length > 0 && (
                <span
                  className={`absolute top-1 right-1 w-2 h-2 rounded-full ${isInCall && actualRoomId === room_id
                    ? "bg-red-500"
                    : "bg-green-500"
                    }`}
                />
              )}
            </div>
          </TooltipWrapper>

          <TooltipWrapper content="Room Information">
            <div
              onClick={(e) => {
                e.stopPropagation();
                toggleSidebar("info");
              }}
              className={`flex-none w-8 select-none h-8 p-2 cursor-pointer rounded-xl flex items-center justify-center transition-colors ${isSidebarOpen && sidebarTab === "info"
                ? "bg-theme-hover"
                : "hover:bg-theme-hover"
                }`}
            >
              <HugeiconsIcon
                icon={InformationCircleIcon}
                className={`w-4 h-4 transition-colors ${isSidebarOpen && sidebarTab === "info" ? "text-white" : "text-gray-300"}`}
              />
            </div>
          </TooltipWrapper>

          <TooltipWrapper content="Room Members" side="left">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRightMobileMenu(!rightMobileMenu);
              }}
              className={`flex-none p-2 lg:hidden rounded-xl ${rightMobileMenu ? "bg-theme-hover" : ""} transition-colors`}
            >
              <HugeiconsIcon
                icon={UserGroupIcon}
                className={`w-4 h-4 ${rightMobileMenu ? "text-white" : "text-gray-300"}`}
              />
            </button>
          </TooltipWrapper>
        </div>
      </div>
    </div>
  );
}
