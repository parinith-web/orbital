import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  Menu01Icon,
  Search01Icon,
  Image01Icon,
  InformationCircleIcon,
  CallIcon,
} from "@hugeicons/core-free-icons";
import { ChatMessageMock } from "./ChatMessageMock";
import { ChatInputBarMock } from "./ChatInputBarMock";
import { RoomMembersMock } from "./RoomMembersMock";
import { CallHistoryMock } from "./CallHistoryMock";

export const FullAppMock = ({ className }: { className?: string }) => (
  <div
    className={`flex w-full md:max-w-[1200px] h-[640px] sm:h-[560px] md:aspect-video md:h-auto overflow-hidden bg-[#0a080b] rounded-2xl border border-white/5 ${className}`}
  >
    {/* Members Sidebar */}
    <div className="w-[280px] flex-none bg-theme-surface border-theme-border border-r hidden md:flex flex-col overflow-hidden text-white select-none">
      <div className="relative w-[268px] flex-none flex items-center justify-between mt-2 rounded-[8px] py-2 px-3 mx-1">
        <div className="flex gap-3 items-center">
          <div className="rounded-[12px] font-medium text-lg text-[#585858] flex items-center justify-center bg-white opacity-90 w-10 h-10">
            P
          </div>
          <div className="flex flex-col items-start">
            <span className="truncate max-w-[120px] text-sm">Projects</span>
            <span className="text-white/40 text-[10px]">ID: 4369</span>
          </div>
        </div>
        <div className="w-8 h-8 flex items-center justify-center hover:bg-theme-hover rounded-[12px]">
          <HugeiconsIcon icon={Menu01Icon} className="w-4 h-4 text-white/90" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <div className="px-3 ">
          <div className="flex justify-between items-center  text-white/40 px-1"></div>
          <RoomMembersMock
            memberCount={7}
            className="bg-transparent border-none p-0"
          />
        </div>
      </div>
    </div>

    {/* Main Area (Matches production TopBar.tsx and ChatUI.tsx) */}

    <div className="flex-1 min-w-0 flex flex-col bg-theme-base overflow-hidden h-full">
      {/* Top Bar */}

      <div className="h-12 flex-none z-[60] relative text-white/60 text-sm px-3 md:px-2 w-full justify-between flex items-center gap-2 bg-theme-surface border-theme-border border-b">
        <div className="md:hidden flex-none p-1">
          <HugeiconsIcon icon={Menu01Icon} className="w-5 h-5 text-gray-400" />
        </div>

        <div className="relative w-full flex-1 md:max-w-[50%] min-w-0">
          <div className="flex px-3 py-1 items-center text-gray-400 rounded-[6px] bg-theme-base overflow-hidden">
            <HugeiconsIcon
              icon={Search01Icon}
              className="flex-none w-4 h-4 text-gray-400"
            />

            <input
              type="text"
              disabled
              placeholder="Search messages"
              className="
        px-2 py-1 bg-transparent outline-none w-full min-w-0
        text-sm md:text-base
        placeholder:text-gray-400
        truncate
      "
            />
          </div>
        </div>

        <div className="flex items-center flex-none md:gap-2 gap-1">
          <div className="w-8 h-8 p-2 cursor-default rounded-xl flex items-center justify-center hover:bg-theme-hover">
            <HugeiconsIcon
              icon={Image01Icon}
              className="w-4 h-4 text-gray-300"
            />
          </div>
          <div className="w-8 h-8 p-2 cursor-default rounded-xl flex items-center justify-center bg-theme-hover relative">
            <HugeiconsIcon icon={CallIcon} className="w-4 h-4 text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
            <CallHistoryMock className="absolute right-0 top-[calc(100%+8px)] z-[70] w-72" />
          </div>
          <div className="w-8 h-8 p-2 cursor-default rounded-xl hidden md:flex items-center justify-center hover:bg-theme-hover">
            <HugeiconsIcon
              icon={InformationCircleIcon}
              className="w-4 h-4 text-white"
            />
          </div>

          <div className="md:hidden w-8 h-8 p-2 cursor-default rounded-xl flex items-center justify-center hover:bg-theme-hover">
            <HugeiconsIcon
              icon={UserGroupIcon}
              className="w-4 h-4 text-gray-300"
            />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 p-0 space-y-0 overflow-y-hidden no-scrollbar">
        <ChatMessageMock
          name="Volt"
          avatar="/assets/pi.png"
          message="That battle earlier was close."
          secondMessage="Thought you had it at one point."
        />
        <ChatMessageMock
          isCurrentUser
          message="Yeah, misplayed the last turn."
          showDate={false}
        />
        <ChatMessageMock
          name="Wave"
          avatar="/assets/sq.png"
          message="Your switch was predictable."
          secondMessage="Kind of gave it away."
          showDate={false}
        />
        <ChatMessageMock
          isCurrentUser
          message="Fair. I rushed it."
          showDate={false}
        />
        <ChatMessageMock
          name="Ember"
          avatar="/assets/ch.png"
          message="Rematch later?"
          secondMessage="I’ll try a different team."
          showDate={false}
        />
        <ChatMessageMock
          name="Wave"
          avatar="/assets/sq.png"
          message="Sure. Send when ready."
          showDate={false}
        />
        <ChatMessageMock
          name="Volt"
          avatar="/assets/pi.png"
          message="Give me a bit."
          showDate={false}
        />
      </div>

      {/* Input Bar */}
      <div className="flex-none w-full flex justify-center pb-4 pt-2 px-4">
        <ChatInputBarMock accent={true} />
      </div>
    </div>
  </div>
);
