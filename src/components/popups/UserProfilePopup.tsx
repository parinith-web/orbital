"use client";

import React, { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { getAvatarUrl } from "@/lib/utils/avatar";
import Image from "next/image";
import { formatDateFull } from "@/lib/utils/date";

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  joinedAt?: string;
}

export interface UserProfilePopupProps {
  user: User;
  currentUserId?: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

/**
 * Read-only profile card: avatar, username, joined date. Deliberately
 * carries no friend-request/DM actions itself — Find People
 * (`src/components/features/friends/FindPeopleView.tsx`) renders its own
 * "Add" button next to each result rather than inside this popup, so this
 * component stays a plain viewer reusable everywhere a user might be
 * clicked on (room member list, message sender, search results) without
 * needing to know about friend-request state.
 */
export function UserProfilePopup({
  user,
  currentUserId,
  children,
  side = "top",
  align = "start",
}: UserProfilePopupProps) {
  const [isOpen, setIsOpen] = useState(false);

  const isCurrentUser = currentUserId === user.id;
  const avatarSrc = getAvatarUrl(user.avatarUrl, user.username);

  if (isCurrentUser) {
    return <>{children}</>;
  }

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>{children}</Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={side}
          align={align}
          sideOffset={8}
          alignOffset={0}
          className="z-[9999] w-64 rounded-xl border border-theme-border outline-none bg-theme-surface animate-in fade-in duration-200"
          onEscapeKeyDown={() => setIsOpen(false)}
        >
          <div className="flex flex-col items-center p-4 gap-3">
            <div className="relative">
              {user.avatarUrl ? (
                <Image
                  src={avatarSrc}
                  width={40}
                  height={40}
                  alt={user.username}
                  className="w-16 h-16 rounded-3xl object-cover ring-1 ring-theme-border"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-theme-hover flex items-center justify-center ring-2 ring-theme-border">
                  <span className="text-lg font-semibold text-white">
                    {user.username}
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-1">
              <h3 className="text-base font-semibold text-white truncate max-w-[200px]">
                {user.username}
              </h3>
              {user.joinedAt && (
                <span className="text-xs text-gray-400">
                  Joined {formatDateFull(user.joinedAt)}
                </span>
              )}
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export default UserProfilePopup;
