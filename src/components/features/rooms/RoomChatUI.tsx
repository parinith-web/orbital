"use client";
import { useState } from "react";

import { useColor } from "@/contexts/colorContext";
import { useUserStore } from "@/store/useUserStore";
import { ChatUI } from "@/components/features/messaging/ChatUI";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { useMessageActions } from "@/hooks";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/dialog";
import type { Id } from "@/convex/_generated/dataModel";

export default function Room({ room_id }: { room_id: string }) {
  const { deleteMessage } = useMessageActions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const user = useUserStore((s) => s.user);
  const { color, textColor } = useColor();

  const onDelete = async () => {
    if (!messageToDelete) return;

    const result = await deleteMessage({
      msg_id: messageToDelete as Id<"messages">,
    });
    
    if (result.error) {
      toast.error(result.error);
      return;
    }

    setDeleteDialogOpen(false);
    setMessageToDelete(null);
    toast.success("Message deleted");
  };

  return (
    <>
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setMessageToDelete(null);
        }}
        title="Delete Message?"
        description="You won't be able to revert this action."
        confirmText="Delete"
        variant="destructive"
        onConfirm={onDelete}
      />

      {!user?.user_id ? (
        <ChatSkeleton />
      ) : (
        <ChatUI
          type="room"
          room_id={room_id}
          user={user}
          color={color}
          textColor={textColor}
          onDeleteRequest={(id) => {
            setMessageToDelete(id);
            setDeleteDialogOpen(true);
          }}
        />
      )}
    </>
  );
}
