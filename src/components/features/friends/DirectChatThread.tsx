"use client";
import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { useColor } from "@/contexts/colorContext";
import { useUserStore } from "@/store/useUserStore";
import { ChatUI } from "@/components/features/messaging/ChatUI";
import { ChatSkeleton } from "@/components/skeletons/ChatSkeleton";
import { useMessageActions } from "@/hooks";
import { ConfirmDialog } from "@/components/ui/dialog";
import { UserAvatar } from "@/components/avatar";
import type { Id } from "@/convex/_generated/dataModel";

interface DirectChatThreadProps {
  conversation_id: string;
  other_user: { user_id: string; username: string; avatar?: string };
  onBack: () => void;
}

/**
 * Session 6b — direct-conversation counterpart to RoomChatUI. Same
 * delete-confirmation-dialog + ChatUI mounting pattern, just fed
 * `type="direct"` and a `direct:<a>:<b>` conversation id instead of a
 * room id — ChatUI itself doesn't know or care about the difference.
 */
export function DirectChatThread({
  conversation_id,
  other_user,
  onBack,
}: DirectChatThreadProps) {
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
    <div className="flex flex-col h-full min-h-0">
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

      <div className="flex-none flex items-center gap-2 px-3 h-12 border-b border-theme-border">
        <button
          onClick={onBack}
          className="md:hidden flex-none p-1 rounded-[8px] hover:bg-theme-hover transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-gray-300" />
        </button>
        <UserAvatar
          avatar={other_user.avatar}
          alt={other_user.username}
          size={28}
          className="w-7 h-7 rounded-[8px] flex-none object-cover overflow-hidden flex items-center justify-center"
        />
        <span className="truncate text-white/90">{other_user.username}</span>
      </div>

      <div className="flex-1 min-h-0">
        {!user?.user_id ? (
          <ChatSkeleton />
        ) : (
          <ChatUI
            type="direct"
            room_id={conversation_id}
            user={user}
            color={color}
            textColor={textColor}
            onDeleteRequest={(id) => {
              setMessageToDelete(id);
              setDeleteDialogOpen(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

export default DirectChatThread;
