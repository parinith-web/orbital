"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@/convex/_generated/api";
import { useUIStore } from "@/store/uiStore";
import { FormDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui";
import { ROUTES } from "@/lib/constants/routes";

/**
 * H6.1 — "Create Room" entry point, calling H5's `createGameRoom` mutation.
 *
 * Deliberately minimal: a host doesn't need to configure anything to spin
 * up a game room (capacity/game_type both have sane defaults on the
 * backend), so the only input is an optional room name. On success we
 * route straight into the (existing, H4-untouched) room page — it's
 * chat-only until H7 repurposes it into the real game-room layout, but
 * routing there today already works since `createGameRoom` seats the host
 * into `roomMembers` before returning.
 */
export function CreateRoomModal() {
  const router = useRouter();
  const { closeModal } = useUIStore();
  const createGameRoom = useMutation(api.gameRoomCode.createGameRoom);
  const [roomName, setRoomName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const trimmed = roomName.trim();
      const result = await createGameRoom(
        trimmed ? { room_name: trimmed } : {},
      );
      if (!result || "error" in result) {
        toast.error(
          (result && "error" in result && result.error) ||
            "Couldn't create the room",
        );
        return;
      }
      closeModal();
      router.push(ROUTES.PORTAL_ROOM(result.room_id));
    } catch {
      toast.error("Couldn't create the room");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && closeModal()}
      title="Create Room"
      onSubmit={handleSubmit}
      submitText="Create"
      loading={isSubmitting}
    >
      <Input
        label="Room name (optional)"
        placeholder="e.g. Friday Night Anomaly"
        value={roomName}
        onChange={(e) => setRoomName(e.target.value)}
        maxLength={60}
        autoFocus
      />
    </FormDialog>
  );
}
