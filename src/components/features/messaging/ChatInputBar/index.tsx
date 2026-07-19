import { useDropzone } from "react-dropzone";
import TextareaAutosize from "react-textarea-autosize";
import { validateFile, formatFileSize } from "@/lib/utils/file";
import { getFileIcon } from "@/lib/utils/file-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Attachment01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
import { toast } from "sonner";
import { ProgressCircle } from "@/components/ui/ProgressCircle";
import Image from "next/image";
import { ChatEmojiPicker } from "../EmojiPicker";
import { useChatInput } from "./useChatInput";
import { TooltipWrapper } from "@/components/ui/tooltip";
import type { ChatInputBarProps } from "./types";
import { useMentionsMenu, MentionsDropdown } from "./MentionsMenu";

export function ChatInputBar(props: ChatInputBarProps) {
  const { room_id, type, color, textColor, scrollToBottom } = props;

  const { input, file, actions, editing } = useChatInput({
    room_id,
    type,
    scrollToBottom,
  });

  const {
    isOpen: showMentionsMenu,
    selectedIndex: selectedMentionIndex,
    filteredUsers: filteredMentions,
    menuRef: mentionsMenuRef,
    handleInputChange,
    handleKeyDown: mentionsKeyDown,
    insertMention,
    setSelectedIndex: setSelectedMentionIndex,
  } = useMentionsMenu(input.ref, input.value, input.onChange, room_id, type);

  const FileIcon = file.upload.file ? getFileIcon(file.upload.file.type) : null;

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files: File[]) => {
      const droppedFile = files[0];
      if (droppedFile) {
        const validation = validateFile(droppedFile);
        if (validation.valid) {
          file.onStart(droppedFile);
        } else {
          toast.error(validation.error);
        }
      }
    },
    noClick: true,
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    mentionsKeyDown(e);

    if (showMentionsMenu && filteredMentions.length > 0) {
      if (["ArrowDown", "ArrowUp", "Enter", "Escape"].includes(e.key)) {
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      actions.onSend();
    } else if (e.key === "Escape") {
      if (editing.message) {
        e.preventDefault();
        editing.onCancel();
      } else if (file.upload.file) {
        file.onCancel();
      }
    }
  };

  return (
    <div
      {...getRootProps()}
      className="flex flex-col z-[99] md:w-[50%] md:min-w-[400px] w-[95%] relative md:px-3 px-2 py-1 md:py-3 rounded-xl bg-theme-surface border border-theme-border"
    >
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          file.upload.file ? "max-h-32 opacity-100 mb-2" : "max-h-0 opacity-0"
        }`}
      >
        {file.upload.file && (
          <div className="flex items-center gap-3 pb-1 bg-theme-surface/40 rounded-xl  relative group">
            <div className="relative w-12 h-12 flex-shrink-0">
              {file.previewUrl ? (
                <div className="w-full h-full rounded-lg overflow-hidden relative border border-theme-hover">
                  <Image
                    src={file.previewUrl}
                    alt="preview"
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full rounded-lg bg-theme-base flex items-center justify-center border border-theme-hover">
                  {FileIcon && (
                    <HugeiconsIcon
                      icon={FileIcon}
                      className="w-6 h-6 text-gray-400"
                    />
                  )}
                </div>
              )}

              {file.upload.isUploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg z-10">
                  <ProgressCircle
                    progress={file.upload.progress}
                    size={32}
                    strokeWidth={2}
                    color={"white"}
                  />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 pr-8">
              <p className="text-sm text-gray-300 truncate font-medium">
                {file.upload.file.name}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {formatFileSize(file.upload.file.size)}
              </p>
            </div>

            <TooltipWrapper content="Cancel">
              <button
                onClick={file.onCancel}
                className="absolute top-2 right-2 p-2 hover:bg-theme-hover rounded-lg text-gray-400 hover:text-white transition-all"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
              </button>
            </TooltipWrapper>
          </div>
        )}
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          editing.message ? "max-h-20 opacity-100 mb-2" : "max-h-0 opacity-0"
        }`}
      >
        {editing.message && (
          <div className="p-2 flex items-center rounded-xl relative text-gray-300">
            <div className="flex-1 min-w-0 pr-8">
              <p className="text-sm">Editing</p>
            </div>
            <TooltipWrapper content="Cancel editing">
              <button
                onClick={editing.onCancel}
                className="absolute top-2 right-2 p-1 hover:bg-theme-hover rounded-lg text-gray-400 hover:text-white transition-all"
              >
                <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
              </button>
            </TooltipWrapper>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <input
          {...getInputProps()}
          ref={file.ref}
          type="file"
          onChange={file.onSelect}
          className="hidden"
        />

        <TextareaAutosize
          ref={input.ref}
          onPaste={(e) => {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
              if (items[i].type.startsWith("image/")) {
                const clipboardFile = items[i].getAsFile();
                if (clipboardFile) {
                  const validation = validateFile(clipboardFile);
                  if (validation.valid) {
                    file.onStart(clipboardFile);
                  } else toast.error(validation.error);
                  break;
                }
              }
            }
          }}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          value={input.value}
          onBlur={() => actions.onClearTyping()}
          placeholder={"Press / to focus"}
          minRows={1}
          maxRows={6}
          autoComplete="off"
          className="w-full rounded-[8px] text-sm bg-transparent text-gray-200 outline-none py-[10px] md:py-2 px-3 placeholder-[#58565f] resize-none overflow-y-auto break-words whitespace-pre-wrap"
        />

        <MentionsDropdown
          isOpen={showMentionsMenu}
          selectedIndex={selectedMentionIndex}
          filteredUsers={filteredMentions}
          menuRef={mentionsMenuRef}
          onSelect={insertMention}
          onHover={setSelectedMentionIndex}
        />

        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <TooltipWrapper content="Attach file">
              <button
                onClick={() => file.ref.current?.click()}
                className="border border-theme-border py-2 px-2 rounded-[12px] text-white hover:bg-theme-border disabled:opacity-50"
                disabled={file.upload.isUploading && !input.value.trim()}
              >
                <HugeiconsIcon
                  icon={Attachment01Icon}
                  className="text-gray-400 w-4 h-4"
                />
              </button>
            </TooltipWrapper>

            <ChatEmojiPicker
              onEmojiSelect={input.onEmojiClick}
              disabled={file.upload.isUploading && !input.value.trim()}
              inputRef={input.ref}
            />
          </div>
          <TooltipWrapper content="Send message">
            <button
              onClick={actions.onSend}
              style={{ backgroundColor: color, color: textColor }}
              className="py-3 px-3 rounded-[12px] disabled:opacity-50"
              disabled={!input.value.trim() && !file.upload.file}
            >
              <HugeiconsIcon icon={ArrowRight01Icon} className="w-3 h-3" />
            </button>
          </TooltipWrapper>
        </div>
      </div>

      {isDragActive && (
        <div className="z-[9999] flex justify-center border border-dashed border-white/50 items-center absolute top-0 left-0 rounded-2xl w-full h-full bg-[#1a1a1a] bg-opacity-90 backdrop-blur-sm">
          <span className="text-white/50 tracking-wider text-xl font-bold">
            DROP TO ATTACH
          </span>
        </div>
      )}
    </div>
  );
}
