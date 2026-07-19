import { useState } from "react";
import { useParams } from "next/navigation";
import { useColor } from "@/contexts/colorContext";
import { useUserStore } from "@/store/useUserStore";
import { ChatUI } from "../messaging/ChatUI";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { useMessageActions } from "@/hooks";
import { getDirectConversationId } from "@/lib/utils/message";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/dialog";
import type { Id } from "@/convex/_generated/dataModel";

export default function FriendChatUI() {
  const params = useParams();
  const friendId = params.friend_id as string | undefined;
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
  const { color, textColor } = useColor();
  const user = useUserStore((s) => s.user);
  const { deleteMessage } = useMessageActions();

  const conversationId =
    friendId && user?.user_id
      ? getDirectConversationId(friendId, user.user_id)
      : null;

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

  const handleDeleteRequest = (id: string) => {
    setMessageToDelete(id);
    setDeleteDialogOpen(true);
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

      <div className="h-full min-h-0">
        {!user || !friendId ? (
          <ChatSkeleton />
        ) : (
          <div className="h-full min-h-0 w-full">
            <ChatUI
              type="direct"
              room_id={conversationId || ""}
              user={user}
              color={color}
              textColor={textColor}
              onDeleteRequest={handleDeleteRequest}
            />
          </div>
        )}
      </div>
    </>
  );
}
