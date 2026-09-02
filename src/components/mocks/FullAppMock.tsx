import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  HashtagIcon,
  Home01Icon,
  Settings01Icon,
  Menu01Icon,
  Search01Icon,
  Image01Icon,
  InformationCircleIcon,
  CallIcon,
} from "@hugeicons/core-free-icons";
import { RoomItemMock } from "./RoomItemMock";
import { ChatMessageMock } from "./ChatMessageMock";
import { ChatInputBarMock } from "./ChatInputBarMock";
import { CallWidgetMock } from "./CallWidgetMock";
import { RoomMembersMock } from "./RoomMembersMock";
import { ProfileButtonMock } from "./ProfileButtonMock";

export const FullAppMock = ({ className }: { className?: string }) => (
  <div
    className={`flex w-full md:max-w-[1200px] h-[640px] sm:h-[560px] md:aspect-video md:h-auto overflow-hidden bg-[#0a080b] rounded-2xl border border-white/5 ${className}`}
  >
    {/* Right Sidebar (moved to left position; border flipped to sit against Main Area) */}
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
            memberCount={4}
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
          <div className="w-8 h-8 p-2 cursor-default rounded-xl flex items-center justify-center hover:bg-theme-hover relative">
            <HugeiconsIcon icon={CallIcon} className="w-4 h-4 text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500" />
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

    {/* Left Sidebar (moved to right position; border flipped to sit against Main Area) */}
    <div className="w-[240px] flex-none bg-theme-surface border-theme-border border-l select-none hidden md:flex flex-col py-2 px-1 md:px-1 text-white items-center font-sans">
      <div className="flex flex-col gap-1 mt-2 text-sm items-center w-full">
        <div className="ease-in-out bg-theme-surface hover:bg-theme-hover text-gray-200 hover:text-white duration-200 flex items-center px-3 gap-2 w-[224px] py-2 rounded-[8px] cursor-default">
          <HugeiconsIcon icon={Home01Icon} className="w-4 h-4" />
          <span>Game Hub</span>
        </div>
        <div className="ease-in-out bg-theme-surface hover:bg-theme-hover text-gray-200 hover:text-white duration-200 flex items-center px-3 gap-2 w-[224px] py-2 rounded-[8px] cursor-default">
          <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" />
          <span>Social</span>
        </div>
        <div className="bg-theme-hover text-white ease-in-out duration-200 flex items-center px-3 gap-2 w-[224px] py-2 rounded-[8px] cursor-default">
          <HugeiconsIcon icon={HashtagIcon} className="w-4 h-4" />
          <span>Rooms</span>
        </div>
        <div className="ease-in-out bg-theme-surface hover:bg-theme-hover text-gray-200 hover:text-white duration-200 flex items-center px-3 gap-2 w-[224px] py-2 rounded-[8px] cursor-default">
          <HugeiconsIcon icon={Settings01Icon} className="w-4 h-4" />
          <span>Settings</span>
        </div>
      </div>

      <div className="mt-3 flex-1 flex flex-col min-h-0 w-full overflow-hidden">
        <div className="flex justify-between items-center px-3 text-[#aaaaaa] mb-2">
          <span className="text-xs font-medium">Rooms</span>
          <div className="bg-theme-hover rounded-[8px] px-2 py-1 flex text-white/60 text-[10px] items-center gap-1">
            <HugeiconsIcon icon={Home01Icon} className="w-3 h-3" />3
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar pr-1 px-1">
          <RoomItemMock
            name="Projects"
            id="4369"
            className="w-full bg-theme-hover border-none shadow-none mt-1"
          />
          <RoomItemMock
            name="Design"
            id="1034"
            className="w-full hover:bg-theme-hover bg-transparent border-none shadow-none  mt-1"
          />
          <RoomItemMock
            name="Engineering"
            id="9450"
            className="w-full hover:bg-theme-hover bg-transparent border-none shadow-none  mt-1"
          />
        </div>
      </div>

      <div className="mt-auto w-full flex flex-col p-1 bg-theme-surface/50">
        <CallWidgetMock
          name="Projects"
          className="w-full bg-theme-hover border-none shadow-none mb-2"
        />
        <ProfileButtonMock
          name="Wave"
          avatar="/assets/sq.png"
          className="w-full bg-theme-hover"
        />
      </div>
    </div>
  </div>
);
