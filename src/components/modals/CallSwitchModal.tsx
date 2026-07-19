"use client";

import { useUIStore } from "@/store/uiStore";
import { useCallStore } from "@/store/callStore";
import { useCallSessionActions } from "@/hooks";
import { useUserStore } from "@/store/useUserStore";
import { ConfirmDialog } from "@/components/ui/dialog";

export function CallSwitchModal() {
  const { closeModal, modalData } = useUIStore();
  const activeCallId = useCallStore((state) => state.callId);
  const { switchSession, startAndJoinCall, leaveCurrentSession } = useCallSessionActions();
  const user = useUserStore((s) => s.user);

  const handleSwitch = async () => {
    const { newCallId, newRoomId, newRoomName, oldCallId, isStartingNew } = modalData;
    const currentCallId = oldCallId || activeCallId;

    if (!currentCallId) {
      closeModal();
      return;
    }

    try {
      if (isStartingNew) {
        await leaveCurrentSession(currentCallId);
        await startAndJoinCall({
          roomId: newRoomId,
          roomName: newRoomName,
          userId: user?.user_id || "",
        });
      } else {
        await switchSession(
          {
            callId: newCallId,
            room: {
              id: newRoomId,
              name: newRoomName,
            },
            userId: user?.user_id || "",
          },
          currentCallId,
        );
      }
      closeModal();
    } catch {
      closeModal();
    }
  };

  return (
    <ConfirmDialog
      open
      onOpenChange={(open) => !open && closeModal()}
      title="Switch Call"
      description="You are already in a call. Joining this one will automatically disconnect you from your current session."
      confirmText="Switch Now"
      onConfirm={handleSwitch}
    />
  );
}