"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  BubbleChatIcon,
  UserMinus01Icon,
} from "@hugeicons/core-free-icons";
import Image from "next/image";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { getAvatarUrl } from "@/lib/utils/avatar";
import { formatDateFull } from "@/lib/utils/date";
import { ListSkeleton } from "@/components/skeletons/ListSkeleton";
import { Button } from "@/components/ui";
import { ConfirmDialog } from "@/components/ui/dialog";
import { UserProfilePopup } from "@/components/popups/UserProfilePopup";
import { useUserStore } from "@/store/useUserStore";

interface FriendsListViewProps {
  onFindPeople: () => void;
  onMessage: (userId: string) => void;
}

/**
 * "My Friends" sub-view — the list of accepted friends. The backend
 * (`listFriends` / `removeFriend`) already existed for Find People's
 * status derivation, this just gives it a dedicated place to be browsed
 * and acted on instead of only being read internally.
 */
export function FriendsListView({ onFindPeople, onMessage }: FriendsListViewProps) {
  const currentUser = useUserStore((s) => s.user);
  const friends = useQuery(api.friends.listFriends);
  const removeFriend = useMutation(api.friends.removeFriend);
  const [removeTarget, setRemoveTarget] = useState<{ user_id: string; username: string } | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      const result = await removeFriend({ user_id: removeTarget.user_id });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Removed ${removeTarget.username} from friends`);
      }
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setIsRemoving(false);
      setRemoveTarget(null);
    }
  };

  if (friends === undefined) {
    return (
      <div className="p-3">
        <ListSkeleton />
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
        <HugeiconsIcon icon={UserGroupIcon} className="w-10 h-10 opacity-40" />
        <p className="text-sm">You haven&apos;t added any friends yet.</p>
        <Button variant="secondary" size="sm" className="gap-1.5" onClick={onFindPeople}>
          <HugeiconsIcon icon={UserGroupIcon} className="w-4 h-4" />
          Find people
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="flex flex-col gap-1 max-w-xl mx-auto">
        {friends.map(({ friend, since }) => (
          <div
            key={friend.user_id}
            className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] bg-theme-surface"
          >
            <UserProfilePopup
              user={{
                id: friend.user_id,
                username: friend.username,
                avatarUrl: friend.avatar,
              }}
              currentUserId={currentUser?.user_id}
              side="right"
              align="start"
            >
              <button className="flex items-center gap-3 min-w-0 flex-1 text-left">
                <Image
                  src={getAvatarUrl(friend.avatar)}
                  alt={friend.username}
                  width={36}
                  height={36}
                  unoptimized
                  className="w-9 h-9 rounded-[10px] flex-none object-cover"
                />
                <div className="flex-1 min-w-0 flex flex-col">
                  <span className="truncate text-white/90">{friend.username}</span>
                  <span className="truncate text-xs text-gray-400">
                    Friends since {formatDateFull(since)}
                  </span>
                </div>
              </button>
            </UserProfilePopup>

            <div className="flex-none flex items-center gap-2">
              <Button
                variant="secondary"
                size="iconSm"
                onClick={() => onMessage(friend.user_id)}
                tooltip="Message"
              >
                <HugeiconsIcon icon={BubbleChatIcon} className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive2"
                size="iconSm"
                onClick={() => setRemoveTarget({ user_id: friend.user_id, username: friend.username })}
                tooltip="Remove friend"
              >
                <HugeiconsIcon icon={UserMinus01Icon} className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={(open) => !open && setRemoveTarget(null)}
        title="Remove friend"
        description={
          removeTarget
            ? `Remove ${removeTarget.username} from your friends? Your chat history will be hidden and you'll need to send a new request to add them back.`
            : ""
        }
        confirmText={isRemoving ? "Removing..." : "Remove"}
        variant="destructive"
        onConfirm={handleRemove}
      />
    </div>
  );
}

export default FriendsListView;
