"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUIStore } from "@/store/uiStore";
import { FormDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui";
import { ROUTES } from "@/lib/constants/routes";
import { JOIN_CODE_LENGTH } from "@/convex/games/lobbyConfig";
import { getTabConnectionId } from "@/lib/games/connectionId";

type JoinGameRoomModalProps = {
  /**
   * Pre-fills the code input. Wired from the sidebar's `?join=` query
   * param so a shared invite link lands here with the code already typed
   * in, without this file needing to change.
   */
  initialCode?: string;
};

/**
 * H6.1 — "Join Room" entry point, calling H5's `joinGameRoomByCode`
 * mutation. Unlike `CreateGameRoomModal`, failures here (bad/expired code)
 * are routine user-input mistakes rather than exceptional errors, so
 * they're shown inline under the field instead of as a toast.
 *
 * Session 2 — renamed from `JoinRoomModal` to `JoinGameRoomModal`.
 * `JOIN_ROOM`/`JoinRoomModal` now means joining a plain chat/call room by
 * its `room_id` (Rooms tab, via `rooms.joinRoom`); this modal keeps the
 * exact same join-by-code game-room behavior, just under `JOIN_GAME_ROOM`
 * and only reachable from the Game Hub tile / `?join=` invite links.
 */
export function JoinGameRoomModal({ initialCode = "" }: JoinGameRoomModalProps) {
  const router = useRouter();
  const { closeModal } = useUIStore();
  const joinGameRoomByCode = useMutation(api.gameRoomCode.joinGameRoomByCode);
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Enter a room code");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await joinGameRoomByCode({
        join_code: trimmed,
        connection_id: getTabConnectionId(),
      });
      if (!result || "error" in result) {
        setError(
          (result && "error" in result && result.error) ||
            "Couldn't join the room",
        );
        return;
      }
      closeModal();
      router.push(ROUTES.ORBITAL_ROOM(result.room_id));
    } catch {
      setError("Couldn't join the room");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormDialog
      open
      onOpenChange={(open) => !open && closeModal()}
      title="Join Room"
      onSubmit={handleSubmit}
      submitText="Join"
      loading={isSubmitting}
      disabled={code.trim().length === 0}
    >
      <Input
        label="Room code"
        placeholder="e.g. 7K4RXP"
        value={code}
        onChange={(e) => {
          setError(null);
          setCode(e.target.value.toUpperCase());
        }}
        maxLength={JOIN_CODE_LENGTH}
        error={error ?? undefined}
        autoFocus
      />
    </FormDialog>
  );
}
