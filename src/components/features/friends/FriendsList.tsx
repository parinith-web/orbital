import Image from "next/image";
import { usePresence } from "@/contexts/presenceContext";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CallIcon,
  Search01Icon,
  UserAdd01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { useUIStore } from "@/store/uiStore";
import { timeAgo } from "@/lib/utils/date";
import { useState } from "react";
import { useUserStore } from "@/store/useUserStore";
import { getDirectConversationId } from "@/lib/utils/message";
import { ConvexFriend, useUnreadCounters } from "@/hooks";
import { useRooms } from "@/contexts/roomContext";
import { useRouter } from "next/navigation";
import { StatusIndicator } from "@/components/ui/StatusIndicator";
import { useColor } from "@/contexts/colorContext";
import { useMemo } from "react";

export default function FriendsList({
  friends,
  isLoading,
}: {
  friends: ConvexFriend[];
  isLoading: boolean;
}) {
  const { onlineUsers, awayUsers } = usePresence();
  const router = useRouter();
  const { setPendingRequestMenu, setModal } = useUIStore();
  const [search, setSearch] = useState("");
  const { color, textColor } = useColor();
  const user = useUserStore((state) => state.user);
  const { activeCallRoomIds } = useRooms();
  const { counters } = useUnreadCounters();

  const { unreadByFriendId, friendHasUnreadMentions } = useMemo(() => {
    const counts = new Map<string, number>();
    const hasMentions = new Map<string, boolean>();
    for (const counter of counters) {
      if (counter.sourceType !== "direct" || counter.unreadCount <= 0) {
        continue;
      }
      const friendId = counter.sourceId;
      counts.set(friendId, (counts.get(friendId) ?? 0) + counter.unreadCount);
      if (counter.hasUnreadMentions) {
        hasMentions.set(friendId, true);
      }
    }
    return { unreadByFriendId: counts, friendHasUnreadMentions: hasMentions };
  }, [counters]);

  const filteredFriends = friends.filter((friend) => {
    return (friend?.friend?.username || "")
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  return (
    <>
      <div className="h-screen flex flex-col">
        <div className="flex mt-3 ml-3 mr-3 gap-3 items-center justify-between">
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex text-sm px-3 w-full md:max-w-[50%] items-center text-white/60 rounded-[6px] bg-theme-hover"
          >
            <HugeiconsIcon
              icon={Search01Icon}
              className="w-4 h-4 text-white/40"
            />
            <input
              type="text"
              placeholder="Search friend"
              onChange={(e) => setSearch(e.target.value)}
              className="px-2 py-1 w-full bg-transparent outline-none placeholder-white/40"
            />
          </div>
          <button
            onClick={() => setModal("ADD_FRIEND")}
            style={{ backgroundColor: color, color: textColor }}
            className="flex text-sm min-w-fit items-center gap-1 ease-in-out hover:brightness-110 hover:opacity-90 px-4 py-1 rounded-[8px]"
          >
            <HugeiconsIcon icon={UserAdd01Icon} className="w-4 h-4" />
            <span>Add friend</span>
          </button>
        </div>
        <div className="flex-1 p-3">
          {filteredFriends.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredFriends.map((friend) => {
                const friendId = friend?.friend?.user_id || null;
                const directConversationId =
                  friendId && user?.user_id
                    ? getDirectConversationId(friendId, user.user_id)
                    : null;
                const hasActiveCall =
                  !!directConversationId &&
                  activeCallRoomIds.has(directConversationId);
                const isUserOnline = friendId
                  ? onlineUsers.has(friendId)
                  : false;
                const isUserAway = friendId ? awayUsers.has(friendId) : false;
                const unreadCount = friendId
                  ? (unreadByFriendId.get(friendId) ?? 0)
                  : 0;
                const hasUnreadMentions = friendId
                  ? (friendHasUnreadMentions.get(friendId) ?? false)
                  : false;
                const isLastMsgByMe = friend?.last_msg_sender === user?.user_id;
                const lastMsgPreview = friend?.last_msg
                  ? isLastMsgByMe
                    ? `You: ${friend.last_msg}`
                    : friend.last_msg
                  : "";

                return (
                  <div
                    key={friend.id}
                    className="group h-[70px] bg-theme-border hover:bg-theme-hover transition-all duration-100 ease-in-out rounded-[8px] gap-3 flex items-center px-3 p-2 cursor-pointer"
                    onClick={() => {
                      if (!friendId) return;
                      router.push(`/portal/friend/${friendId}`);
                      setPendingRequestMenu(false);
                    }}
                  >
                    <div className="relative">
                      <Image
                        src={
                          friend?.friend?.avatar || "/assets/defaultAvatar.png"
                        }
                        alt=""
                        width={40}
                        height={40}
                        unoptimized
                        className="w-10 h-10 rounded-[12px]"
                      />
                      {hasActiveCall ? (
                        <HugeiconsIcon
                          icon={CallIcon}
                          className="rounded-full text-green-500 bg-theme-hover border border-theme-border p-0.5 absolute -right-1 bottom-0 h-4 w-4"
                        />
                      ) : (
                        <StatusIndicator
                          isOnline={isUserOnline}
                          isAway={isUserAway}
                        />
                      )}
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-white/90 text-sm truncate w-[80px]">
                          {friend?.friend?.username}
                        </span>
                        {unreadCount > 0 && (
                          <span
                            className={`mr-1 inline-flex font-medium w-4 h-4 justify-center items-center rounded-full p-2 text-[8px] ${
                              hasUnreadMentions
                                ? "bg-red-500"
                                : "bg-theme-accent"
                            }`}
                            style={{
                              color: hasUnreadMentions ? "#ffffff" : textColor,
                            }}
                          >
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`${unreadCount == 0 ? "text-[#aaaaaa]" : "text-white"} text-xs truncate w-[80px]`}
                        >
                          {lastMsgPreview}
                        </span>
                        <span className="text-[#aaaaaa] text-xs whitespace-nowrap mr-2">
                          {timeAgo(friend?.updated_at || friend?._creationTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full mt-[30%] justify-center">
              <div
                className={`${isLoading ? "hidden" : "block"} rounded-[14px] text-center`}
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-[12px] border border-theme-border bg-theme-base">
                  <HugeiconsIcon
                    icon={UserGroupIcon}
                    className="h-5 w-5 text-gray-400"
                  />
                </div>
                <p className="mt-4 text-xs text-gray-400">No friends yet</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
