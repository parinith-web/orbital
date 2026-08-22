"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRoomActions } from "@/hooks";
import { useUIStore } from "@/store/uiStore";
import { FormDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Session 2 — "Join Room" entry point for the Rooms tab, ported from
 * Portal. This is a plain chat/call room: joins by the room's own
 * `room_id` via `rooms.joinRoom` (through `useRoomActions`) — no join
 * code, no game session involved.
 *
 * This is deliberately the `JOIN_ROOM` modal now — the previous
 * join-by-code game-room behavior that used to live here moved to
 * `JoinGameRoomModal` under `JOIN_GAME_ROOM`, reachable only from the
 * Game Hub tile / `?join=` invite links.
 */
export function JoinRoomModal() {
  const { closeModal } = useUIStore();
  const { joinRoom } = useRoomActions();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: { roomId: "" },
  });

  const onSubmit = async (data: { roomId: string }) => {
    const trimmed = data.roomId.trim();
    if (!trimmed) {
      toast.error("Enter a Room ID!");
      return;
    }
    const result = await joinRoom({ room_id: trimmed });

    if (result?.error) {
      if (result.error.includes("already in this room")) {
        toast.info("You are already in this room");
        closeModal();
        router.replace(ROUTES.ORBITAL_ROOM(trimmed));
      } else {
        toast.error(result.error);
      }
      return;
    }

    closeModal();
    toast.success("Room joined successfully");
    router.replace(ROUTES.ORBITAL_ROOM(trimmed));
  };

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && closeModal()}
      title="Join Room"
      onSubmit={handleSubmit(onSubmit)}
      submitText="Join"
      loading={isSubmitting}
    >
      <Input
        {...register("roomId", { required: true, minLength: 4 })}
        label="Room ID"
        placeholder="Room ID"
        autoFocus
        autoCorrect="off"
        autoCapitalize="none"
      />
    </FormDialog>
  );
}
