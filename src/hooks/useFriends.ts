"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCallback } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useFriendsContext } from "@/contexts/FriendsContext";

export interface PendingRequest {
  id: Id<"friends">;
  _creationTime: number;
  sender: {
    user_id: string;
    username: string;
    avatar?: string;
  } | null;
}

export interface SentRequest {
  id: Id<"friends">;
  _creationTime: number;
  receiver: {
    user_id: string;
    username: string;
    avatar?: string;
  } | null;
}

export interface ConvexFriend {
  id: Id<"friends">;
  friend: {
    user_id: string;
    username: string;
    avatar?: string;
  };
  last_msg?: string;
  last_msg_sender?: string;
  updated_at?: number;
  _creationTime: number;
  last_read_time?: number;
  notificationPreference?: string;
}

export interface UseFriendsResult {
  friends: ConvexFriend[];
  pendingRequests: PendingRequest[];
  sentRequests: SentRequest[];
  isLoading: boolean;
}

export function useFriends(): UseFriendsResult {
  return useFriendsContext();
}

export function useFriendsQuery(): UseFriendsResult {
  const friendsQuery = useQuery(api.friends.getFriends);
  const pendingRequestsQuery = useQuery(api.friends.getPendingRequests);
  const sentRequestsQuery = useQuery(api.friends.getSentRequests);

  const sortedFriends = (friendsQuery ?? []).sort((a, b) => {
    const timeA = a.updated_at ?? a._creationTime ?? 0;
    const timeB = b.updated_at ?? b._creationTime ?? 0;
    return timeB - timeA;
  });

  return {
    friends: sortedFriends,
    pendingRequests: pendingRequestsQuery ?? [],
    sentRequests: sentRequestsQuery ?? [],
    isLoading: friendsQuery === undefined,
  };
}

export interface UseFriendActionsResult {
  sendRequest: (receiverId: string) => Promise<any>;
  acceptRequest: (requestId: Id<"friends">) => Promise<any>;
  rejectRequest: (requestId: Id<"friends">) => Promise<any>;
  removeFriend: (friendId: string) => Promise<any>;
  setNotificationPreference: (args: { friend_id: string; preference: string }) => Promise<any>;
  isLoading: boolean;
}

export function useFriendActions(): UseFriendActionsResult {
  const sendRequestMutation = useMutation(api.friends.sendRequest);
  const acceptRequestMutation = useMutation(api.friends.acceptRequest);
  const rejectRequestMutation = useMutation(api.friends.rejectRequest);
  const removeFriendMutation = useMutation(api.friends.removeFriend);

  const sendRequest = useCallback(
    async (receiverId: string) => {
      return await sendRequestMutation({ receiver_id: receiverId });
    },
    [sendRequestMutation]
  );

  const acceptRequest = useCallback(
    async (requestId: Id<"friends">) => {
      return await acceptRequestMutation({ requestId });
    },
    [acceptRequestMutation]
  );

  const rejectRequest = useCallback(
    async (requestId: Id<"friends">) => {
      return await rejectRequestMutation({ requestId });
    },
    [rejectRequestMutation]
  );

  const removeFriend = useCallback(
    async (friendId: string) => {
      return await removeFriendMutation({ friend_id: friendId });
    },
    [removeFriendMutation]
  );

  const setNotificationPreferenceMutation = useMutation(api.friends.setNotificationPreference);

  const setNotificationPreference = useCallback(
    async ({ friend_id, preference }: { friend_id: string; preference: string }) => {
      return await setNotificationPreferenceMutation({ friend_id, preference });
    },
    [setNotificationPreferenceMutation]
  );

  return {
    sendRequest,
    acceptRequest,
    rejectRequest,
    removeFriend,
    setNotificationPreference,
    isLoading: false,
  };
}