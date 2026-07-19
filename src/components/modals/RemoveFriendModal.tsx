import { useUIStore } from "@/store/uiStore";
import { ConfirmDialog } from "@/components/ui/dialog";
import { useFriendActions } from "@/hooks";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";

export function RemoveFriendModal() {
  const { closeModal, modalData } = useUIStore();
  const { removeFriend } = useFriendActions();
  const router = useRouter();
  const pathname = usePathname();

  const targetId = modalData?.user?.id || modalData?.friend?.friend?.user_id;
  const targetUsername = modalData?.user?.username || modalData?.friend?.friend?.username;

  const handleRemoveFriend = async () => {
    if (!targetId) return;

    try {
      await removeFriend(targetId);
      toast.success("Friend removed");
      closeModal();

      if (pathname.includes(`/portal/friend/${targetId}`)) {
        router.push("/portal");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to remove friend",
      );
    }
  };

  if (!targetId) return null;

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && closeModal()}
      title={`Remove friend ${targetUsername}?`}
      description="You can send them a friend request again later."
      confirmText="Remove"
      variant="primary"
      onConfirm={handleRemoveFriend}
    />
  );
}
