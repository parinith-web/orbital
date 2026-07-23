"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react";
import { UserGroupIcon, Tick01Icon, Cancel01Icon } from "@hugeicons/core-free-icons";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { Button } from "@/components/ui";

/**
 * Session 6a — Requests sub-view. Incoming requests get Accept/Decline
 * (wired to `respondToFriendRequest`); outgoing just show "Pending" — there's
 * no cancel-outgoing-request mutation in the Session 5 backend (only the
 * recipient can act on a pending row), so there's nothing to wire a cancel
 * button to yet. Accepting an incoming request also creates the
 * `conversations` row server-side, which is what Session 6b's Chats view
 * will read from.
 */
export function RequestsView() {
  const pending = useQuery(api.friends.listPendingRequests);
  const respond = useMutation(api.friends.respondToFriendRequest);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const handleRespond = async (requestId: Id<"friends">, accept: boolean) => {
    setActingOn(requestId);
    try {
      const result = await respond({ request_id: requestId, accept });
      if ("error" in result) {
        toast.error(result.error);
      } else if (accept) {
        toast.success("Friend request accepted");
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setActingOn(null);
    }
  };

  if (pending === undefined) {
    return (
      <div className="p-3">
        <ListSkeleton />
      </div>
    );
  }

  const { incoming, outgoing } = pending;
  const isEmpty = incoming.length === 0 && outgoing.length === 0;

  if (isEmpty) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
        <HugeiconsIcon icon={UserGroupIcon} className="w-10 h-10 opacity-40" />
        <p className="text-sm">No pending requests.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex flex-col gap-4 max-w-xl mx-auto">
        {incoming.length > 0 && (
          <section className="flex flex-col gap-1">
            <h2 className="text-xs text-gray-400 px-2 mb-1">
              Incoming ({incoming.length})
            </h2>
            {incoming.map((request) => (
              <div
                key={request.request_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-theme-surface"
              >
                <Image
                  src={getAvatarUrl(request.user.avatar)}
                  alt={request.user.username}
                  width={36}
                  height={36}
                  unoptimized
                  className="w-9 h-9 rounded-[10px] flex-none object-cover"
                />
                <div className="flex-1 min-w-0">
                  <span className="truncate text-white/90 block">
                    {request.user.username}
                  </span>
                </div>
                <div className="flex-none flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="iconSm"
                    disabled={actingOn === request.request_id}
                    onClick={() => handleRespond(request.request_id, true)}
                    tooltip="Accept"
                  >
                    <HugeiconsIcon icon={Tick01Icon} className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="destructive2"
                    size="iconSm"
                    disabled={actingOn === request.request_id}
                    onClick={() => handleRespond(request.request_id, false)}
                    tooltip="Decline"
                  >
                    <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </section>
        )}

        {outgoing.length > 0 && (
          <section className="flex flex-col gap-1">
            <h2 className="text-xs text-gray-400 px-2 mb-1">
              Outgoing ({outgoing.length})
            </h2>
            {outgoing.map((request) => (
              <div
                key={request.request_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-theme-surface"
              >
                <Image
                  src={getAvatarUrl(request.user.avatar)}
                  alt={request.user.username}
                  width={36}
                  height={36}
                  unoptimized
                  className="w-9 h-9 rounded-[10px] flex-none object-cover"
                />
                <div className="flex-1 min-w-0">
                  <span className="truncate text-white/90 block">
                    {request.user.username}
                  </span>
                </div>
                <span className="flex-none text-xs text-gray-400 px-2">
                  Pending
                </span>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}

export default RequestsView;
