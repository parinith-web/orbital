import * as Popover from "@radix-ui/react-popover";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useUIStore } from "@/store/uiStore";
import { timeAgo } from "@/lib/utils/date";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Tick01Icon,
  Cancel01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import {
  useFriendActions,
  type PendingRequest,
  type SentRequest,
} from "@/hooks";
import { toast } from "sonner";
import type { Id } from "@/convex/_generated/dataModel";
import React from "react";
import { TooltipWrapper } from "@/components/ui/tooltip";


interface RequestUser {
  avatar?: string;
  username?: string;
}

interface RequestItemProps {
  user: RequestUser;
  createdAt: number;
  actions: React.ReactNode;
}

function RequestItem({ user, createdAt, actions }: RequestItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded-[6px]">
      <Image
        src={user.avatar || "/assets/defaultAvatar.png"}
        width={32}
        height={32}
        unoptimized
        alt=""
        className="w-8 h-8 rounded-[6px]"
      />
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm truncate">{user.username}</div>
        <div className="text-white/40 text-xs">{timeAgo(createdAt)}</div>
      </div>
      {actions}
    </div>
  );
}

interface PendingRequestMenuProps {
  pendingRequests: PendingRequest[];
  sentRequests: SentRequest[];
}

export default function PendingRequestMenu({
  pendingRequests,
  sentRequests,
}: PendingRequestMenuProps) {
  const { pendingRequestMenu, setPendingRequestMenu } = useUIStore();
  const { acceptRequest, rejectRequest } = useFriendActions();

  const handleAccept = async (req_id: string) => {
    const result = await acceptRequest(req_id as Id<"friends">);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Friend request accepted");
    }
  };

  const handleReject = async (req_id: string, showToast: boolean) => {
    const result = await rejectRequest(req_id as Id<"friends">);
    if (result.error) {
      if (showToast) toast.error(result.error);
    } else {
      if (showToast) toast.success("Friend request rejected");
    }
  };

  return (
    <Popover.Root
      open={pendingRequestMenu}
      onOpenChange={setPendingRequestMenu}
    >
      <TooltipWrapper content="Friend Requests">
        <Popover.Trigger asChild>
          <button
            onClick={() => {
              setPendingRequestMenu(!pendingRequestMenu);
            }}
            className={`relative select-none p-2 cursor-pointer rounded-xl flex items-center justify-center hover:bg-theme-hover`}
          >
            <HugeiconsIcon icon={Clock01Icon} className="w-4 h-4" />
            <div
              className={`${pendingRequests.length > 0 ? "block" : "hidden"} w-2 h-2 bg-red-600 rounded-full absolute top-1 right-2`}
            ></div>
          </button>
        </Popover.Trigger>
      </TooltipWrapper>

      <Popover.Anchor asChild>
        <div />
      </Popover.Anchor>
      <Popover.Portal>
        <Popover.Content
          className="z-[9000] p-2 rounded-[8px] h-[35%] min-w-[250px] bg-theme-base border border-theme-border"
          sideOffset={8}
          align="end"
          onEscapeKeyDown={() => setPendingRequestMenu(false)}
        >
          <Tabs defaultValue="received" className="flex flex-col h-full">
            <TabsList className="bg-theme-surface text-sm text-white h-9 rounded-[8px] w-fit p-1 flex items-center gap-1">
              <TabsTrigger
                value="received"
                className="px-3 py-1 rounded-[6px]"
              />
              <TabsTrigger value="sent" className="px-3 py-1 rounded-[6px]" />
            </TabsList>

            <TabsContent
              value="received"
              className="mt-2 flex flex-col gap-1 max-h-[200px] overflow-y-auto"
            >
              {pendingRequests.length === 0 ? (
                <div className="text-white/40 text-xs p-2 mx-auto my-[30%]">
                  No pending requests
                </div>
              ) : (
                pendingRequests.map((request) => (
                  <RequestItem
                    key={request.id}
                    user={request.sender ?? {}}
                    createdAt={request._creationTime}
                    actions={
                      <>
                        <TooltipWrapper content="Accept">
                          <button
                            onClick={() => handleAccept(request.id)}
                            className="p-1 rounded-[6px] hover:bg-theme-hover"
                          >
                            <HugeiconsIcon
                              icon={Tick01Icon}
                              className="w-4 h-4 text-green-500"
                            />
                          </button>
                        </TooltipWrapper>

                        <TooltipWrapper content="Reject">
                          <button
                            onClick={() => handleReject(request.id, true)}
                            className="p-1 rounded-[6px] hover:bg-theme-hover"
                          >
                            <HugeiconsIcon
                              icon={Cancel01Icon}
                              className="w-4 h-4 text-gray-300"
                            />
                          </button>
                        </TooltipWrapper>

                      </>
                    }
                  />
                ))
              )}
            </TabsContent>

            <TabsContent
              value="sent"
              className="mt-2 flex flex-col gap-1 max-h-[200px] overflow-y-auto"
            >
              {sentRequests.length === 0 ? (
                <div className="text-white/40 text-xs p-2 mx-auto my-[30%]">
                  No sent requests
                </div>
              ) : (
                sentRequests.map((request) => (
                  <RequestItem
                    key={request.id}
                    user={request.receiver ?? {}}
                    createdAt={request._creationTime}
                    actions={
                      <TooltipWrapper content="Cancel request">
                        <button
                          onClick={() => handleReject(request.id, false)}
                          className="p-1 rounded-[6px] hover:bg-theme-hover"
                        >
                          <HugeiconsIcon
                            icon={Cancel01Icon}
                            className="w-4 h-4 text-gray-300"
                          />
                        </button>
                      </TooltipWrapper>

                    }
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
