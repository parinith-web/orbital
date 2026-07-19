"use client";
import { useUIStore } from "@/store/uiStore";
// Import modals (to be created next)
import { JoinRoomModal } from "@/components/modals/JoinRoomModal";
import { CreateRoomModal } from "@/components/modals/CreateRoomModal";
import { LogoutModal } from "@/components/modals/LogoutModal";
import { LeaveDialog } from "@/components/features/rooms/LeaveDialog";

import { AddFriendDialog } from "@/components/features/friends/AddFriendDialog";
import { RemoveFriendModal } from "@/components/modals/RemoveFriendModal";
import { CallSwitchModal } from "@/components/modals/CallSwitchModal";

export function GlobalModals() {
  const { activeModal, modalData, closeModal } = useUIStore();

  if (!activeModal) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-35 z-[9998] transition-opacity"
        onClick={closeModal}
      />
      <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
        <div className="pointer-events-auto w-full h-full flex items-center justify-center">
          {activeModal === "JOIN_ROOM" && <JoinRoomModal key="join" />}
          {activeModal === "CREATE_ROOM" && <CreateRoomModal key="create" />}
          {activeModal === "LOGOUT" && <LogoutModal key="logout" />}
          {activeModal === "LEAVE_ROOM" && (
            <LeaveDialog key={modalData?.room_id} />
          )}
          {activeModal === "ADD_FRIEND" && <AddFriendDialog key="add_friend" />}
          {activeModal === "REMOVE_FRIEND" && (
            <RemoveFriendModal key="remove_friend" />
          )}
          {activeModal === "SWITCH_CALL" && (
            <CallSwitchModal key="switch_call" />
          )}
        </div>
      </div>
    </>
  );
}
