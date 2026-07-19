import { useRoomActions } from "@/hooks";
import { toast } from "sonner";
import { useUIStore } from "@/store/uiStore";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { ConfirmDialog } from "@/components/ui/dialog";

export const LeaveDialog = () => {
  const { modalData, closeModal } = useUIStore();
  const user = useUserStore((s) => s.user);
  const router = useRouter();

  if (!modalData) return null;
  const { roomName, room_id, owner_id } = modalData;

  const isOwner = String(owner_id) === String(user?.user_id);
  const { deleteRoom, leaveRoom } = useRoomActions();

  const onAction = async () => {
    if (isOwner) {
      const result = await deleteRoom({ room_id });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Room deleted");
    } else {
      const result = await leaveRoom({ room_id });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Left room");
    }
    closeModal();
    router.replace("/portal");
  };

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && closeModal()}
      title={isOwner ? `Delete the room "${roomName}"?` : `Leave the room "${roomName}"?`}
      description={
        isOwner
          ? "You won't be able to revert this action!"
          : "You can join back anytime using the Room ID."
      }
      confirmText={isOwner ? "Delete" : "Leave"}
      variant="destructive"
      onConfirm={onAction}
    />
  );
};