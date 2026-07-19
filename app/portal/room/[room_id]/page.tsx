"use client";
import Room from "@/components/features/rooms/RoomChatUI";
import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRoomMembers } from "@/hooks";
import { useAuth } from "@clerk/nextjs";
import { use } from "react";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";

export default function Page({
  params,
}: {
  params: Promise<{ room_id: string }>;
}) {
  const { room_id } = use(params);
  const router = useRouter();
  const members = useRoomMembers(room_id);
  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthLoaded) return;

    if (!userId) {
      router.replace(`/`);
      return;
    }

    if (members !== undefined) {
      const isMember = members.some(
        (m: { user_id: string }) => m.user_id === userId,
      );
      if (!isMember) {
        router.replace("/portal");
      } else {
        setChecking(false);
      }
    }
  }, [room_id, router, members, userId, isAuthLoaded]);

  if (checking) return <ChatSkeleton />;

  return (
    <Suspense fallback={null}>
      <Room room_id={room_id} />
    </Suspense>
  );
}
