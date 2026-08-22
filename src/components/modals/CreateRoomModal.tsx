"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRoomActions } from "@/hooks";
import { useUIStore } from "@/store/uiStore";
import { generateRoomCode } from "@/app/actions/randomID";
import { FormDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui";
import { ROUTES } from "@/lib/constants/routes";

/**
 * Session 2 — "Create Room" entry point for the Rooms tab, ported from
 * Portal. This is a plain chat/call room: no `gameSessions` row, no join
 * code — just `rooms.createRoom` (via `useRoomActions`, already present
 * and unused until now) seating the host into a brand new room they can
 * immediately chat and call in.
 *
 * This is deliberately the `CREATE_ROOM` modal now — the previous
 * game-room behavior that used to live here moved to
 * `CreateGameRoomModal` under `CREATE_GAME_ROOM`, reachable only from the
 * Game Hub tile.
 */
export function CreateRoomModal() {
  const { closeModal } = useUIStore();
  const { createRoom } = useRoomActions();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: { roomName: "" },
  });

  const onSubmit = async (data: { roomName: string }) => {
    if (!data.roomName.trim()) {
      toast.error("Enter a valid room name!");
      return;
    }
    const generated_id = await generateRoomCode();
    const result = await createRoom({
      room_name: data.roomName.trim(),
      room_id: generated_id.toString(),
    });

    if (result?.error) {
      toast.error(result.error);
      return;
    }

    closeModal();
    toast.success("Room created successfully");
    router.push(ROUTES.ORBITAL_ROOM(generated_id.toString()));
  };

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && closeModal()}
      title="Create Room"
      onSubmit={handleSubmit(onSubmit)}
      submitText="Create"
      loading={isSubmitting}
    >
      <Input
        {...register("roomName", { required: true })}
        label="Room Name"
        placeholder="Room Name"
        inputSize="sm"
        autoFocus
        autoComplete="off"
      />
    </FormDialog>
  );
}
