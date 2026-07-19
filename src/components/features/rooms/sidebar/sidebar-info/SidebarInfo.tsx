"use client";

import { useState, useEffect } from "react";
import {
  SidebarLayout,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useRoomActions, useRoomMembers } from "@/hooks";
import { formatDateFull } from "@/lib/utils/date";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDownIcon,
  Checkmark,
  CircleIcon,
} from "@hugeicons/core-free-icons";
import { RoomAvatar } from "@/components/ui/RoomAvatar";

const NOTIFICATION_OPTIONS = [
  { value: "all", label: "All messages" },
  { value: "mentions", label: "Mentions only" },
  { value: "nothing", label: "Nothing" },
];

interface SidebarInfoProps {
  id: string;
  type: "room";
  room: any;
  members: any[];
  currentUser: any;
  isLoading: boolean;
  onClose: () => void;
}

export function SidebarInfo({
  id,
  type,
  room,
  members,
  currentUser,
  isLoading,
  onClose,
}: SidebarInfoProps) {
  const { renameRoom, setNotificationPreference } = useRoomActions();
  const roomMembers = useRoomMembers(id);
  const [editedName, setEditedName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationPref, setNotificationPref] = useState<string>("all");

  useEffect(() => {
    if (room?.room_name) {
      setEditedName(room.room_name);
    }
  }, [room?.room_name]);

  useEffect(() => {
    if (roomMembers && currentUser?.user_id) {
      const myMember = roomMembers.find(
        (m) => m.Users?.user_id === currentUser?.user_id,
      );
      setNotificationPref(myMember?.notificationPreference || "all");
    }
  }, [roomMembers, currentUser?.user_id]);

  const isOwner = room?.owner_id === currentUser?.user_id;
  const owner = members?.find((m) => m.role === "owner");
  const ownerName = owner?.Users?.username || "Unknown";

  const handleRename = async () => {
    if (!editedName.trim() || editedName === room?.room_name) return;
    try {
      setIsSubmitting(true);
      const result = await renameRoom({ room_id: id, new_name: editedName });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Room name updated");
    } catch (e) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationChange = async (preference: string) => {
    try {
      const result = await setNotificationPreference({
        room_id: id,
        preference,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setNotificationPref(preference);
    } catch (e) {
      toast.error("Failed to update preference");
    }
  };

  const canSave =
    isOwner &&
    editedName.trim() &&
    editedName !== room?.room_name &&
    editedName.length >= 3 &&
    editedName.length <= 16;

  const getCurrentLabel = () => {
    const option = NOTIFICATION_OPTIONS.find(
      (o) => o.value === notificationPref,
    );
    return option?.label || "All messages";
  };

  return (
    <SidebarLayout>
      <SidebarHeader title="Room Info" onClose={onClose} />
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-20 h-20">
            <RoomAvatar
              name={room?.room_name}
              className="w-20 h-20 rounded-[24px] text-xl"
            />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-white">{room?.room_name}</h2>
            <p className="text-xs text-white/40">ID: {id}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 text-sm">
          <Input
            label="Room Name"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            disabled={!isOwner || isSubmitting}
            placeholder="Room Name"
            autoComplete="off"
          />
          <Input label="Room Owner" value={ownerName} disabled />
          <Input
            label="Created On"
            value={
              isLoading
                ? "Loading..."
                : formatDateFull(room?._creationTime || 0)
            }
            disabled
          />

          <div className="flex flex-col gap-2">
            <label className="text-xs text-white/60">Notifications</label>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  className="flex text-gray-200 items-center justify-between w-full  outline-none cursor-pointer"
                >
                  <span>{getCurrentLabel()}</span>
                  <HugeiconsIcon
                    icon={ArrowDownIcon}
                    className="w-4 h-4 text-gray-400"
                  />
                </Button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  sideOffset={2}
                  align="end"
                  className="w-full min-w-[200px] bg-theme-base border border-theme-border rounded-lg shadow-xl z-[100] animate-in fade-in duration-100 outline-none"
                >
                  {NOTIFICATION_OPTIONS.map((option) => (
                    <DropdownMenu.Item
                      key={option.value}
                      onClick={() => handleNotificationChange(option.value)}
                      className="flex items-center justify-between px-3 py-2.5 text-sm text-gray-200 hover:bg-theme-hover cursor-pointer outline-none first:rounded-t-lg last:rounded-b-lg"
                    >
                      <span>{option.label}</span>
                    </DropdownMenu.Item>
                  ))}
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </div>
      <SidebarFooter>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            onClick={() => setEditedName(room?.room_name || "")}
            disabled={
              isSubmitting ||
              editedName === room?.room_name ||
              !editedName.trim()
            }
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="other"
            onClick={handleRename}
            disabled={isSubmitting || !canSave}
            loading={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </SidebarFooter>
    </SidebarLayout>
  );
}
