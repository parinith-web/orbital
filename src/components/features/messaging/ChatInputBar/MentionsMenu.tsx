"use client";

import {
  useState,
  useEffect,
  useRef,
  useMemo,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserStore } from "@/store/useUserStore";
import { getAvatarUrl } from "@/lib/utils/avatar";

interface MentionUser {
  user_id: string;
  username: string;
  avatar?: string;
}

function getDMParticipantId(
  conversationId: string,
  currentUserId: string,
): string | null {
  if (!conversationId.startsWith("direct_")) return null;
  const parts = conversationId.replace("direct_", "").split("_");
  if (parts.length !== 2) return null;
  return parts[0] === currentUserId ? parts[1] : parts[0];
}

type InputChangeHandler = (e: ChangeEvent<HTMLTextAreaElement>) => void;

export function useMentionsMenu(
  inputRef: React.RefObject<HTMLTextAreaElement | null>,
  inputValue: string,
  onInputChange: InputChangeHandler,
  conversationId: string,
  conversationType: "room" | "direct",
) {
  const currentUser = useUserStore((state) => state.user);

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const roomMembers =
    conversationType === "room"
      ? useQuery(api.roomQueries.getRoomMembers, { room_id: conversationId })
      : null;

  const dmParticipantId = useMemo(() => {
    if (conversationType !== "direct" || !currentUser?.user_id) return null;
    return getDMParticipantId(conversationId, currentUser.user_id);
  }, [conversationType, conversationId, currentUser?.user_id]);

  const dmParticipant = dmParticipantId
    ? useQuery(api.users.getUserById, { user_id: dmParticipantId })
    : null;

  const users: MentionUser[] = useMemo(() => {
    if (!currentUser?.user_id) return [];

    if (conversationType === "room" && roomMembers) {
      return roomMembers
        .filter(
          (m: { Users?: { user_id: string } }) =>
            m.Users?.user_id !== currentUser.user_id,
        )
        .map(
          (m: {
            Users?: { user_id: string; username?: string; avatar?: string };
            user_id: string;
            username?: string;
          }) => ({
            user_id: m.Users?.user_id || m.user_id,
            username: m.Users?.username || m.username || "Unknown",
            avatar: m.Users?.avatar,
          }),
        );
    }

    if (conversationType === "direct" && dmParticipant) {
      return [
        {
          user_id: dmParticipant.user_id,
          username: dmParticipant.username || "Unknown",
          avatar: dmParticipant.avatar,
        },
      ];
    }

    return [];
  }, [conversationType, roomMembers, dmParticipant, currentUser?.user_id]);

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const lower = search.toLowerCase();
    return users.filter((u) => u.username.toLowerCase().includes(lower));
  }, [users, search]);

  useEffect(() => {
    if (isOpen) setSelectedIndex(0);
  }, [filteredUsers.length]);

  const insertMention = (user: MentionUser) => {
    const textarea = inputRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = inputValue.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const newValue =
        inputValue.slice(0, lastAtIndex) +
        `@${user.username} ` +
        inputValue.slice(cursorPos);

      textarea.value = newValue;
      onInputChange({
        target: textarea,
        currentTarget: textarea,
      } as unknown as React.ChangeEvent<HTMLTextAreaElement>);

      setTimeout(() => {
        textarea.focus();
        const newCursorPos = lastAtIndex + user.username.length + 2;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }

    setIsOpen(false);
    setSelectedIndex(0);
  };

  const handleOnInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    onInputChange(e);

    const textBeforeCursor = value.slice(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      const hasWhitespace = /\s/.test(textAfterAt);

      if (!hasWhitespace && textAfterAt.length >= 0) {
        setIsOpen(true);
        setSearch(textAfterAt);
        const textarea = inputRef.current;
        if (textarea) {
          const rect = textarea.getBoundingClientRect();
          setPosition({ top: rect.height + 8, left: 16 });
        }
      } else {
        setIsOpen(false);
      }
    } else {
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!isOpen || filteredUsers.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredUsers.length - 1 ? prev + 1 : 0,
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredUsers.length - 1,
      );
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const selectedUser = filteredUsers[selectedIndex];
      if (selectedUser) insertMention(selectedUser);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSelectedIndex(0);
      return;
    }
  };

  return {
    isOpen,
    search,
    position,
    selectedIndex,
    filteredUsers,
    menuRef,
    handleInputChange: handleOnInputChange,
    handleKeyDown,
    insertMention,
    setSelectedIndex,
  };
}

interface MentionsDropdownProps {
  isOpen: boolean;
  selectedIndex: number;
  filteredUsers: { user_id: string; username: string; avatar?: string }[];
  menuRef: React.RefObject<HTMLDivElement | null>;
  onSelect: (user: {
    user_id: string;
    username: string;
    avatar?: string;
  }) => void;
  onHover: (index: number) => void;
}

export function MentionsDropdown({
  isOpen,
  selectedIndex,
  filteredUsers,
  menuRef,
  onSelect,
  onHover,
}: MentionsDropdownProps) {
  if (!isOpen || filteredUsers.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="absolute z-[100] bg-theme-surface border w-full border-theme-border rounded-lg shadow-lg max-h-60 overflow-y-auto"
      style={{ bottom: "100%", left: 0, right: 0, marginBottom: 8 }}
    >
      {filteredUsers.map((user, index) => (
        <button
          key={user.user_id}
          onClick={() => onSelect(user)}
          onMouseEnter={() => onHover(index)}
          className={`w-full flex items-center gap-3 px-3 py-2 transition-colors text-left ${index === selectedIndex ? "bg-theme-hover" : "hover:bg-theme-hover"
            }`}
        >
          <div className="relative w-8 h-8 flex-shrink-0">
            <Image
              src={getAvatarUrl(user.avatar, user.username)}
              alt={user.username}
              fill
              quality={25}
              className="rounded-[12px] object-cover bg-theme-border"
            />
          </div>
          <span className="text-sm text-gray-200">{user.username}</span>
        </button>
      ))}
    </div>
  );
}
