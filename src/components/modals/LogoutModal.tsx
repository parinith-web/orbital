import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useUIStore } from "@/store/uiStore";
import { ConfirmDialog } from "@/components/ui/dialog";

export function LogoutModal() {
  const { closeModal } = useUIStore();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      closeModal();
      router.push("/");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && closeModal()}
      title="Log Out"
      description="Are you sure you want to log out? You can sign in back anytime."
      confirmText="Log Out"
      onConfirm={handleLogout}
    />
  );
}