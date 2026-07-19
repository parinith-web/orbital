"use client";

import React, { useState, useCallback, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { useFriendActions, useFriends } from "@/hooks";
import { toast } from "sonner";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Message01Icon } from "@hugeicons/core-free-icons";
import { useRouter } from "next/navigation";
import { formatDateFull } from "@/lib/utils/date";
import { TooltipWrapper } from "../ui/tooltip";

import { useUIStore } from "@/store/uiStore";

export interface User {
  id: string;
  username: string;
  avatarUrl?: string;
  joinedAt: string;
}

export interface UserProfilePopupProps {
  user: User;
  isFriend?: boolean;
  currentUserId?: string;
  children: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
}

export function UserProfilePopup({
  user,
  isFriend: isFriendProp,
  currentUserId,
  children,
  side = "top",
  align = "start",
}: UserProfilePopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { sendRequest } = useFriendActions();
  const { friends, sentRequests } = useFriends();

  const { setModal } = useUIStore();

  const router = useRouter();

  const isCurrentUser = currentUserId === user.id;
  const isAlreadyFriend = useMemo(
    () => friends.some((f) => f.friend?.user_id === user.id),
    [friends, user.id],
  );
  const hasSentRequest = useMemo(
    () => sentRequests.some((s) => s.receiver?.user_id === user.id),
    [sentRequests, user.id],
  );
  const isFriend = isFriendProp ?? isAlreadyFriend;

  const handleSendRequest = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    const result = await sendRequest(user.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Friend request sent");
    }
    setIsLoading(false);
  }, [sendRequest, user.id, isLoading]);

  const handleDM = useCallback(() => {
    setIsOpen(false);
    router.push(`/portal/friend/${user.id}`);
  }, [router, user.id]);

  const avatarSrc = getAvatarUrl(user.avatarUrl, user.username);

  if (isCurrentUser) {
    return <>{children}</>;
  }

  return (
    <>
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
            onPointerDownOutside={(e) => {
              const target = e.target as HTMLElement;
              if (
                target.closest("button[data-friend-request]") ||
                target.closest("button[data-remove-friend]") ||
                target.closest("button[data-dm-friend]")
              ) {
                e.preventDefault();
              }
            }}
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
                <span className="text-xs text-gray-400">
                  Joined {formatDateFull(user.joinedAt)}
                </span>
              </div>
              {isFriend ? (
                <div className="flex item-center gap-2 w-full">
                  <Button
                    data-dm-friend
                    onClick={handleDM}
                    disabled={isLoading}
                    variant="other"
                    size="iconMd"
                    className="text-gray-300 hover:text-white"
                  >
                    <HugeiconsIcon className="h-5 w-5 " icon={Message01Icon} />
                  </Button>
                  <Button
                    data-remove-friend
                    onClick={() => {
                      setIsOpen(false);
                      setModal("REMOVE_FRIEND", { user });
                    }}
                    disabled={isLoading}
                    variant="destructive2"
                    size="md"
                    className="flex-1"
                  >
                    {isLoading ? "Removing..." : "Remove Friend"}
                  </Button>
                </div>
              ) : hasSentRequest ? (
                <div className="w-full py-2 px-4 rounded-lg bg-theme-hover text-gray-300 text-sm text-center">
                  Request Sent
                </div>
              ) : (
                <Button
                  data-friend-request
                  onClick={handleSendRequest}
                  disabled={isLoading}
                  variant="other"
                  size="md"
                  className="w-full"
                >
                  {isLoading ? "Sending..." : "Send Friend Request"}
                </Button>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </>
  );
}

export default UserProfilePopup;
