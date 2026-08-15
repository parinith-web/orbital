"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { CopyIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { api } from "@/convex/_generated/api";
import { useUIStore } from "@/store/uiStore";
import {
  FormDialog,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui";
import { Button } from "@/components/ui/button";
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
 *
 * Bugfix: `createGameRoom` returns the `join_code` friends actually need
 * to get in via "Join Room" — but this modal used to discard it and route
 * straight into the room, so the host had no way to see or share it. The
 * only "copy" affordance anywhere in the room UI was "Copy Room ID", which
 * copies the internal `room_id` (long, not the 6-char join code the "Join
 * Room" modal's `maxLength` field expects) — pasting that into "Join Room"
 * either got silently truncated or, even if pasted whole, would never
 * match a real `join_code`, so joins always failed. Now the code is shown
 * in a share step (with a copy button and a copyable `?join=` link) before
 * the host continues into the room.
 */
export function CreateRoomModal() {
  const router = useRouter();
  const { closeModal } = useUIStore();
  const createGameRoom = useMutation(api.gameRoomCode.createGameRoom);
  const [roomName, setRoomName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [created, setCreated] = useState<{
    room_id: string;
    join_code: string;
  } | null>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

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
      setCreated({ room_id: result.room_id, join_code: result.join_code });
    } catch {
      toast.error("Couldn't create the room");
    } finally {
      setIsSubmitting(false);
    }
  };

  const enterRoom = () => {
    if (!created) return;
    closeModal();
    router.push(ROUTES.PORTAL_ROOM(created.room_id));
  };

  const copyCode = async () => {
    if (!created) return;
    await navigator.clipboard.writeText(created.join_code);
    setCopied("code");
    toast.success("Room code copied");
  };

  const copyLink = async () => {
    if (!created) return;
    const link = `${window.location.origin}/portal?join=${created.join_code}`;
    await navigator.clipboard.writeText(link);
    setCopied("link");
    toast.success("Invite link copied");
  };

  if (created) {
    return (
      <Dialog open onOpenChange={(open) => !open && enterRoom()}>
        <DialogContent className="w-full sm:w-96">
          <DialogHeader>
            <DialogTitle>Room created</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col gap-4">
            <p className="text-sm text-white/60">
              Share this code with friends so they can join from &ldquo;Join
              Room&rdquo;.
            </p>
            <div className="flex items-center justify-between gap-3 rounded-xl border border-theme-border bg-theme-hover px-4 py-3">
              <span className="text-2xl font-semibold tracking-[0.3em] text-white">
                {created.join_code}
              </span>
              <button
                type="button"
                onClick={copyCode}
                className="shrink-0 flex items-center gap-1.5 text-xs text-white/70 hover:text-white rounded-lg px-2.5 py-1.5 hover:bg-theme-surface cursor-pointer"
              >
                <HugeiconsIcon
                  icon={copied === "code" ? Tick01Icon : CopyIcon}
                  className="w-3.5 h-3.5"
                />
                Copy
              </button>
            </div>
            <button
              type="button"
              onClick={copyLink}
              className="flex items-center justify-center gap-1.5 text-xs text-white/60 hover:text-white cursor-pointer"
            >
              <HugeiconsIcon
                icon={copied === "link" ? Tick01Icon : CopyIcon}
                className="w-3.5 h-3.5"
              />
              Copy invite link instead
            </button>
          </div>
          <DialogFooter>
            <Button variant="primary" size="md" onClick={enterRoom}>
              Enter Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

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
