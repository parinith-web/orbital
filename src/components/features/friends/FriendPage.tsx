"use client";
import { Suspense } from "react";
import { useParams } from "next/navigation";
import { usePresence } from "@/contexts/presenceContext";
import { useUIStore } from "@/store/uiStore";
import { useUserStore } from "@/store/useUserStore";
import { useFriends, useCalls } from "@/hooks";
import { getDirectConversationId } from "@/lib/utils/message";
import { useCallStore } from "@/store/callStore";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { DetailsSidebar } from "@/components/features/rooms/sidebar/DetailsSidebar";
import FriendChatUI from "./FriendChatUI";
import { FriendChatHeader } from "./FriendChatHeader";
import { CallOverlay } from "@/components/features/calls/CallOverlay";
import { RoomCallProvider } from "@/contexts/CallContext";

export function FriendPage() {
  const params = useParams();
  const friendId = params.friend_id as string;
  const user = useUserStore((s) => s.user);
  const { friends } = useFriends();
  const { onlineUsers, awayUsers } = usePresence();
  
  const directConversationId =
    friendId && user?.user_id
      ? getDirectConversationId(friendId, user.user_id)
      : "";

  const { activeCalls } = useCalls(directConversationId);
  const { status: callStatus, actualRoomId } = useCallStore();
  const isInCall = callStatus === "joined";
  const { isSidebarOpen } = useUIStore();

  const friend = friends.find((f) => f?.friend?.user_id === friendId);

  return (
    <RoomCallProvider roomId={directConversationId}>
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 relative">
          <FriendChatHeader
            friend={friend}
            directConversationId={directConversationId}
            onlineUsers={onlineUsers}
            awayUsers={awayUsers}
            activeCalls={activeCalls}
            isInCall={isInCall}
            actualRoomId={actualRoomId}
          />
          <div className="flex-1 flex overflow-hidden relative">
            <div className="flex-1 overflow-hidden relative">
              <Suspense fallback={<ChatSkeleton />}>
                <FriendChatUI />
              </Suspense>
            </div>
            {isSidebarOpen && (
              <DetailsSidebar
                id={directConversationId}
                type="direct"
                title={friend?.friend?.username || "Direct Message"}
              />
            )}
          </div>
          <CallOverlay />
        </div>
      </div>
    </RoomCallProvider>
  );
}
