"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useFriends } from "@/hooks";
import { FriendPage } from "@/components/features/friends/FriendPage";

function FriendPageContent() {
  const params = useParams();
  const router = useRouter();
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [checking, setChecking] = useState(true);

  const { friends, isLoading: isLoadingFriends } = useFriends();

  const friendId = params.friend_id as string;
  const friend = friends.find((f) => f?.friend?.user_id === friendId);
  const isFriend = !!friend;

  useEffect(() => {
    if (!isAuthLoaded) return;

    if (!userId) {
      router.replace(`/`);
      return;
    }

    if (friendId && friendId.length > 0) {
      if (isLoadingFriends) return;

      if (!isFriend) {
        router.replace("/portal");
        return;
      }
      setChecking(false);
    } else {
      router.replace("/portal");
    }
  }, [friendId, router, userId, isAuthLoaded, isFriend, isLoadingFriends]);

  if (checking) return null;

  return <FriendPage />;
}

export default function Page() {
  return <FriendPageContent />;
}
