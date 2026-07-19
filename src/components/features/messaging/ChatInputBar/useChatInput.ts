import { useState, useCallback, useEffect, useRef } from "react";
import {
  useMessageActions,
  useTypingIndicators,
} from "@/hooks/useMessageActions";
import { useUIStore } from "@/store/uiStore";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { useFileUpload } from "./useFileUpload";
import type { ChatInputBarProps } from "./types";

export function useChatInput({
  room_id,
  type,
  scrollToBottom,
}: Pick<ChatInputBarProps, "room_id" | "type" | "scrollToBottom">) {
  const [msg, setMsg] = useState("");

  const { setTyping, clearTyping } = useTypingIndicators(room_id);
  const { sendMessage, generateUploadUrl, updateMessage } = useMessageActions();
  const { editingMessage, setEditingMessage } = useUIStore();

  // File upload hook
  const {
    upload,
    startUpload,
    handleFileSelect,
    cancelUpload,
    previewUrl,
    fileInputRef,
  } = useFileUpload(generateUploadUrl);

  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Populate edit mode
  useEffect(() => {
    if (editingMessage) {
      setMsg(editingMessage.content);
      inputRef.current?.focus();
    } else {
      setMsg("");
    }
  }, [editingMessage]);

  // Global '/' shortcut
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMsg(e.target.value);
      if (e.target.value.trim()) {
        setTyping();
      } else {
        clearTyping();
      }
    },
    [setTyping, clearTyping],
  );

  const onEmojiClick = useCallback(
    (emojiData: { emoji: string }) => {
      const textarea = inputRef.current;
      if (!textarea) return;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newText = msg.slice(0, start) + emojiData.emoji + msg.slice(end);
      setMsg(newText);
      const newCursorPos = start + emojiData.emoji.length;
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPos, newCursorPos);
      });
    },
    [msg],
  );

  const handleSendMessage = useCallback(async () => {
    if (!msg.trim() && !upload.file) return;

    // Editing flow
    if (editingMessage) {
      const content = msg.trim();
      if (!content || content === editingMessage.content) {
        setEditingMessage(null);
        setMsg("");
        return;
      }

      const editId = editingMessage.id;
      setEditingMessage(null);
      setMsg("");

      try {
        const result = await updateMessage({
          msg_id: editId as Id<"messages">,
          content: content,
        });
        if (result.error) {
          toast.error(result.error);
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to update message");
      }
      return;
    }

    let storageId = upload.storageId;
    const fileToSend = upload.file;
    const contentToSend = msg.trim();

    if (fileToSend && !storageId) {
      if (upload.isUploading) {
        toast.info("Waiting for upload to finish...");
        return;
      } else {
        try {
          await startUpload(fileToSend);
          storageId = upload.storageId;
        } catch (error) {
          console.error(error);
          toast.error("Failed to upload file");
          return;
        }
      }
    }

    // Clear input and state immediately to prevent double sends
    // and allow the user to type the next message while offline.
    setMsg("");
    cancelUpload();
    scrollToBottom();
    clearTyping();

    try {
      const result = await sendMessage({
        conversation_id: room_id,
        conversation_type: type,
        msg: contentToSend || null,
        file_storage_id: storageId || undefined,
        file_type: fileToSend?.type || null,
        file_name: fileToSend?.name || null,
        file_size: fileToSend?.size,
      });
      if (result && result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message");
    }
  }, [
    msg,
    upload,
    room_id,
    type,
    sendMessage,
    startUpload,
    clearTyping,
    scrollToBottom,
    editingMessage,
    setEditingMessage,
    updateMessage,
    cancelUpload,
  ]);

  return {
    input: {
      ref: inputRef,
      value: msg,
      onChange: handleInputChange,
      onEmojiClick,
    },
    file: {
      ref: fileInputRef,
      previewUrl,
      upload,
      onSelect: handleFileSelect,
      onCancel: cancelUpload,
      onStart: startUpload,
    },
    actions: {
      onSend: handleSendMessage,
      onClearTyping: clearTyping,
    },
    editing: {
      message: editingMessage,
      onCancel: () => setEditingMessage(null),
    },
  } as const;
}
