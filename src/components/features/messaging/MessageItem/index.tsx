import { formatTimeOnly, formatDateFull } from "@/lib/utils/date";
import { formatFileSize } from "@/lib/utils/file";
import {
  shouldShowMeta,
  shouldShowDateDivider,
  isOnlyEmojis,
} from "@/lib/utils/message";
import { getSenderAvatar, getDisplayName } from "@/lib/utils/avatar";
import Image from "next/image";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";
import { VideoMessage } from "../VideoMessage";
import { MessageToolbar } from "./MessageToolbar";
import { MessageReactions } from "./MessageReactions";
import { UserProfilePopup } from "@/components/popups/UserProfilePopup";
import type { User, MessageWithSender } from "@/lib/types";
import { useUIStore } from "@/store/uiStore";
import { LinkifiedText } from "../LinkifiedText";
import React from "react";

interface MessageItemProps {
  message: MessageWithSender;
  prevMessage: MessageWithSender | null;
  nextMessage: MessageWithSender | null;
  user: User | null;
  isCurrentUser: boolean;
  color: string;
  textColor: string;
  onPreviewMedia: (url: string) => void;
  onDeleteRequest: (id: string) => void;
  highlighted?: boolean;
}

export const MessageItem = React.memo(
  ({
    message,
    prevMessage,
    user,
    isCurrentUser,
    textColor,
    onPreviewMedia,
    onDeleteRequest,
    highlighted = false,
  }: MessageItemProps) => {
    const { setEditingMessage } = useUIStore();

    const { isImage, isVideo, isFile, isSystem, isJumbo } = React.useMemo(
      () => ({
        isImage: message.type?.startsWith("image/"),
        isVideo: message.type?.startsWith("video/"),
        isFile: !!(
          message.file_url &&
          !message.type?.startsWith("image/") &&
          !message.type?.startsWith("video/")
        ),
        isSystem: message.type === "system",
        isJumbo: isOnlyEmojis(message.content),
      }),
      [message.type, message.file_url, message.content],
    );

    const { messageDate, showDateDivider, showMeta, timeString } =
      React.useMemo(
        () => ({
          messageDate: formatDateFull(message._creationTime),
          showDateDivider: shouldShowDateDivider(message, prevMessage),
          showMeta: shouldShowMeta(message, prevMessage),
          timeString: formatTimeOnly(message._creationTime),
        }),
        [message._creationTime, message._id, prevMessage?._id],
      );

    const senderAvatar = React.useMemo(
      () =>
        getSenderAvatar(
          message.sender_id,
          user?.user_id,
          message.sender,
          user ?? undefined,
        ),
      [message.sender_id, message.sender, user],
    );

    const displayName = React.useMemo(
      () => getDisplayName(message.sender_id, user?.user_id, message.sender),
      [message.sender_id, message.sender, user?.user_id],
    );

    if (isSystem) {
      return (
        <div className="w-full px-4 md:px-10" data-message-id={message._id}>
          {showDateDivider && (
            <div
              data-date-header="true"
              data-date-string={messageDate}
              className="flex items-center justify-center py-4"
            >
              <span className="px-4 py-1 rounded-full bg-theme-border text-xs text-gray-300">
                {messageDate}
              </span>
            </div>
          )}
          <div
            data-msg-id={message._id}
            className={`px-3 mx-auto rounded-[6px] items-center text-gray-400 text-xs flex justify-center py-1 transition-colors duration-500 ${highlighted ? "bg-yellow-500/20" : ""}`}
          >
            <span className="font-medium">{message.sender?.username}</span>
            <span className="ml-2 whitespace-pre-wrap">{message.content}</span>
            <span className="ml-2">{timeString}</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full" data-message-id={message._id}>
        {showDateDivider && (
          <div className="px-4 md:px-10">
            <div
              data-date-header="true"
              data-date-string={messageDate}
              className="flex items-center justify-center py-4"
            >
              <span className="px-4 py-1 rounded-full bg-theme-border text-xs text-gray-300">
                {messageDate}
              </span>
            </div>
          </div>
        )}
        <div
          className={`px-8 md:px-10 hover:bg-theme-border group/row relative transition-colors duration-200 ${highlighted ? "bg-yellow-500/10" : ""}`}
        >
          <div
            data-msg-id={message._id}
            className={`flex gap-2 ${showMeta ? "mt-3" : "pt-[0]"} flex-row`}
          >
            {showMeta ? (
              <UserProfilePopup
                user={{
                  id: message.sender_id,
                  username: displayName,
                  avatarUrl: senderAvatar,
                  joinedAt: message.sender?._creationTime
                    ? new Date(message.sender._creationTime).toISOString()
                    : new Date().toISOString(),
                }}
                currentUserId={user?.user_id}
                side="right"
                align="start"
              >
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-[12px] ${!isCurrentUser ? "cursor-pointer hover:opacity-80 transition-opacity" : ""}`}
                >
                  <Image
                    src={senderAvatar}
                    width={40}
                    height={40}
                    unoptimized
                    alt={message.sender?.username || "User"}
                    className="w-10 h-10 rounded-[12px]"
                  />
                </div>
              </UserProfilePopup>
            ) : (
              <div className="w-10" />
            )}

            <div className="flex flex-col max-w-[60%] items-start">
              {showMeta && (
                <div className="flex items-center gap-1 px-1 flex-row">
                  <UserProfilePopup
                    user={{
                      id: message.sender_id,
                      username: displayName,
                      avatarUrl: senderAvatar,
                      joinedAt: message.sender?._creationTime
                        ? new Date(message.sender._creationTime).toISOString()
                        : new Date().toISOString(),
                    }}
                    currentUserId={user?.user_id}
                    side="top"
                    align="start"
                  >
                    <span
                      className={`text-xs truncate min-w-0 max-w-[140px] text-gray-400 text-left ${!isCurrentUser ? "cursor-pointer" : ""}`}
                    >
                      {displayName}
                    </span>
                  </UserProfilePopup>
                  <span className="text-[10px] truncate min-w-0 max-w-[150px] text-gray-500">
                    {timeString}
                    {(message as any).edited && (
                      <span className="ml-1 opacity-60">(edited)</span>
                    )}
                  </span>
                </div>
              )}
              <div
                id={`msg-${message._id}`}
                style={{ color: isImage || isVideo ? undefined : textColor }}
                className={`text-sm relative group ${isFile ? "px-0.5 py-0.5" : !showMeta ? "px-1 py-0" : "px-1 py-1"} rounded-[6px] ${isImage || isVideo ? "bg-transparent" : isCurrentUser ? "" : "text-white"}`}
              >
                {isImage && message.file_url && (
                  <div className="flex flex-col gap-1">
                    <div className="relative group/img max-w-[300px] md:max-w-[500px] rounded-[12px] overflow-hidden min-h-[200px]">
                      <Image
                        src={message.file_url}
                        alt="uploaded"
                        width={500}
                        height={500}
                        className="w-full h-auto object-contain cursor-pointer aspect-auto"
                        onClick={() =>
                          onPreviewMedia(message.file_url as string)
                        }
                      />
                    </div>
                  </div>
                )}

                {isVideo && message.file_url && (
                  <div className="flex flex-col gap-1">
                    <div className="min-h-[150px] w-full max-w-[200px] md:max-w-[500px] rounded-[6px] overflow-hidden bg-theme-surface border border-theme-border">
                      <VideoMessage
                        src={message.file_url}
                        onPreview={() =>
                          onPreviewMedia(message.file_url as string)
                        }
                      />
                    </div>
                  </div>
                )}

                {isFile && message.file_url && (
                  <a
                    href={message.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 py-1 transition-colors duration-200 mb-1 group/file"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border border-white/5">
                      <HugeiconsIcon
                        icon={File02Icon}
                        className="w-5 h-5 text-gray-400"
                      />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm break-words opacity-90">
                        {message.file_name || "Attachment"}
                      </span>
                      {message.file_size && (
                        <span className="text-[11px] opacity-60">
                          {formatFileSize(message.file_size)}
                        </span>
                      )}
                    </div>
                  </a>
                )}

                {message.content && (
                  <LinkifiedText
                    text={message.content}
                    className={`text-white whitespace-pre-wrap ${isJumbo ? "text-4xl py-1" : ""}`}
                    style={{ color: isImage || isVideo ? undefined : "" }}
                  />
                )}
              </div>

              <MessageReactions
                messageId={message._id as string}
                reactions={(message as any).reactions || []}
                currentUserId={user?.user_id || ""}
              />
            </div>
          </div>
          <MessageToolbar
            content={message.content}
            messageId={message._id as string}
            onDeleteRequest={onDeleteRequest}
            onEditRequest={() =>
              setEditingMessage({
                id: message._id,
                content: message.content || "",
              })
            }
            isCurrentUser={isCurrentUser}
          />
        </div>
      </div>
    );
  },
);

MessageItem.displayName = "MessageItem";
