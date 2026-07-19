import { toast } from "sonner";
import { useFriendActions } from "@/hooks";
import { useUIStore } from "@/store/uiStore";
import { useForm } from "react-hook-form";
import { FormDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function AddFriendDialog() {
  const { closeModal } = useUIStore();
  const { sendRequest } = useFriendActions();

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm({
    defaultValues: { friendId: "" }
  });

  const onSubmit = async (data: { friendId: string }) => {
    if (!data.friendId.trim()) {
      toast.info("Please enter a valid user ID");
      return;
    }

    const result = await sendRequest(data.friendId.trim());
    
    if (result.error) {
      toast.error(result.error);
      return;
    }

    toast.success("Friend request sent!");
    reset();
    closeModal();
  };

  return (
    <FormDialog
      open
      onOpenChange={(open) => {
        if (!open) {
          reset();
          closeModal();
        }
      }}
      title="Add Friend"
      onSubmit={handleSubmit(onSubmit)}
      submitText="Send"
      loading={isSubmitting}
    >
      <Input
        {...register("friendId", { required: true })}
        label="User ID"
        placeholder="Enter User's ID"
        autoFocus
        autoCorrect="off"
        autoCapitalize="none"
      />
    </FormDialog>
  );
}