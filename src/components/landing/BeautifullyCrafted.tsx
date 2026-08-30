"use client";

import { motion, MotionValue } from "framer-motion";
import { RefObject } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserAdd01Icon, Upload01Icon } from "@hugeicons/core-free-icons";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { Button } from "@/components/ui/button";
import { TooltipWrapper } from "@/components/ui/tooltip";
import {
  RoomItemMock,
  FriendItemMock,
  PendingRequestMock,
  CallWidgetMock,
  RoomMembersMock,
  ParticipantCardMock,
  ProfileButtonMock,
  MessageNotificationMock,
  CallEndedNotificationMock,
  ChatInputBarMock,
  UserProfilePopupMock,
  RecentCallItemMock,
  CallControlsMock,
  AvatarStatusMock,
} from "@/components/mocks";

interface BeautifullyCraftedProps {
  beautifullyCraftedRef: RefObject<HTMLElement | null>;
  beautifullyCraftedOpacity: MotionValue<number>;
  beautifullyCraftedBlur: MotionValue<string>;
}

export function BeautifullyCrafted({
  beautifullyCraftedRef,
  beautifullyCraftedOpacity,
  beautifullyCraftedBlur,
}: BeautifullyCraftedProps) {
  return (
    <section
      ref={beautifullyCraftedRef}
      className="relative mt-0 md:mt-36 h-screen text-white overflow-x-auto md:overflow-visible flex items-center justify-center"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
    >
      {/* Hide scrollbars on webkit browsers */}
      <style>{`
        [data-scroll-hide]::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div
        className="relative w-full max-w-none sm:max-w-2xl md:max-w-3xl lg:max-w-4xl xl:max-w-5xl h-screen flex items-center justify-center overflow-x-auto md:overflow-visible px-2 md:px-4 lg:px-0"
        style={{
          WebkitMaskImage:
            "radial-gradient(circle, black 35%, transparent 85%)",
          maskImage: "radial-gradient(circle, black 35%, transparent 85%)",
        }}
      >
        {/* Centered label — sits above the grid in z */}
        <span className="font-display selection:bg-white/10 text-2xl md:text-7xl text-white hidden leading-tight text-center absolute z-10 drop-shadow-[0_0_30px_rgba(0,0,0,0.5)] pointer-events-none">
          Beautifully Crafted
          <br />
          Interface
        </span>

        <motion.div
          style={{
            opacity: beautifullyCraftedOpacity,
            filter: beautifullyCraftedBlur,
          }}
          className="select-none pointer-events-none z-0 w-full flex flex-col gap-2 md:gap-2 items-center justify-center px-2 md:px-0 relative"
        >
          {/* ROW 1: ParticipantCard, PendingRequest, RoomMembers, UserProfile, Status Indicators */}
          <div
            data-scroll-hide
            className="absolute md:relative top-32 md:top-0 left-0 right-0 w-full flex flex-row overflow-x-auto md:overflow-visible md:flex-row justify-start md:justify-center items-end gap-2 md:gap-3 lg:gap-2 md:pt-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Mobile only: PendingRequest + RoomMembers */}
            <div className="-ml-[50px] flex md:hidden flex-row gap-2 flex-shrink-0">
              <PendingRequestMock />
              <RoomMembersMock />
              <UserProfilePopupMock />
            </div>

            {/* Desktop only */}
            <div className="hidden md:flex flex-row gap-2 items-end">
              <ParticipantCardMock />
              <PendingRequestMock />
              <RoomMembersMock />
              <UserProfilePopupMock />
            </div>
            <div className="select-none flex-shrink-0 hidden md:block">
              <div className="mt-2">
                <div className="mt-2 flex py-2.5 px-6 max-w-28 justify-center bg-[#242424] relative items-center gap-2 rounded-lg text-xs">
                  <StatusIndicator
                    className="relative w-2 h-2"
                    isOnline={true}
                    isAway={false}
                  />
                  <span className="text-green-500">Online</span>
                </div>
                <div className="mt-2 flex py-2.5 px-6 max-w-28 justify-center bg-[#242424] relative items-center gap-2 rounded-lg text-xs">
                  <StatusIndicator
                    className="relative w-2 h-2"
                    isOnline={false}
                    isAway={true}
                  />
                  <span className="text-yellow-400">Away</span>
                </div>
              </div>
            </div>
          </div>

          {/* ROW 2: div1 (notification + friend) | Heading | div2 (callended + widget) */}
          <div className="hidden md:flex w-full flex-col md:flex-row justify-center items-center gap-2 md:gap-2">
            {/* Left div: MessageNotification + FriendItem */}
            <div className="hidden md:flex flex-col gap-2 md:gap-2 flex-shrink-0 items-end">
              <MessageNotificationMock />
              <FriendItemMock />
            </div>

            {/* Center Heading */}
            <div className="text-center flex-shrink-0 mx-4">
              <span className="font-display text-3xl md:text-6xl text-white leading-tight drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                Beautifully Crafted
                <br />
                Interface
              </span>
            </div>

            {/* Right div: CallEnded + CallWidget */}
            <div className="hidden md:flex flex-col gap-2 md:gap-2 flex-shrink-0">
              <CallEndedNotificationMock />
              <CallWidgetMock />
            </div>
          </div>

          {/* Mobile Only: Centered Heading */}
          <div className="md:hidden text-center w-full py-8">
            <span className="font-display text-3xl text-white leading-tight drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
              Beautifully Crafted
              <br />
              Interface
            </span>
          </div>

          {/* ROW 3: CallControls, ChatInputBar, AvatarStatus, Upload, AddFriend */}
          <div
            data-scroll-hide
            className="absolute md:relative bottom-32 md:bottom-0 left-0 right-0 w-full flex flex-row overflow-x-auto md:overflow-visible md:flex-row justify-start md:justify-center items-start gap-2 md:gap-3 lg:gap-2 md:pb-0"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Mobile only: CallEnded + MessageNotification */}
            <div className="-ml-[50px] flex md:hidden flex-row gap-2 items-end">
              <CallEndedNotificationMock className="min-w-[250px]" />
              <MessageNotificationMock className="min-w-[300px]" />
              <ChatInputBarMock accent={false} className="w-72 min-w-[350px]" />
            </div>

            {/* Desktop only */}
            <div className="hidden md:flex flex-col gap-2 flex-shrink-0 items-end">
              <CallControlsMock />
              <ProfileButtonMock />
            </div>
            <div className="hidden md:flex flex-shrink-0">
              <ChatInputBarMock accent={false} className="min-w-[350px]" />
            </div>
            <div className="hidden md:flex flex-shrink-0">
              <AvatarStatusMock />
            </div>
            <div className="hidden md:flex flex-col gap-2 flex-shrink-0 items-start">
              <div className="flex flex-row gap-2 items-center">
                <Button
                  className="bg-[#212121] text-white/80"
                  variant="other"
                  size="iconLg"
                >
                  <HugeiconsIcon icon={Upload01Icon} className="w-7 h-7" />
                </Button>
                <div className="flex flex-col gap-2 flex-shrink-0 items-center">
                  <button className="flex text-sm items-center gap-1 ease-in-out hover:brightness-110 hover:opacity-90 px-4 py-1 rounded-[8px] bg-white text-black">
                    <HugeiconsIcon icon={UserAdd01Icon} className="w-4 h-4" />
                    <span>Add friend</span>
                  </button>
                  <span className="px-5 py-1 rounded-full bg-theme-border text-xs text-gray-300">
                    26 April 2026
                  </span>
                </div>
              </div>
              <RoomItemMock />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
