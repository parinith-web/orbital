"use client";
import { useUIStore } from "@/store/uiStore";
import { LogoutModal } from "@/components/modals/LogoutModal";
import { LeaveDialog } from "@/components/features/rooms/LeaveDialog";
import { CallSwitchModal } from "@/components/modals/CallSwitchModal";
import { CreateRoomModal } from "@/components/modals/CreateRoomModal";
import { JoinRoomModal } from "@/components/modals/JoinRoomModal";

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
          {activeModal === "LOGOUT" && <LogoutModal key="logout" />}
          {activeModal === "LEAVE_ROOM" && (
            <LeaveDialog key={modalData?.room_id} />
          )}
          {activeModal === "SWITCH_CALL" && (
            <CallSwitchModal key="switch_call" />
          )}
          {activeModal === "CREATE_ROOM" && (
            <CreateRoomModal key="create_room" />
          )}
          {activeModal === "JOIN_ROOM" && (
            <JoinRoomModal
              key="join_room"
              initialCode={modalData?.join_code}
            />
          )}
        </div>
      </div>
    </>
  );
}
