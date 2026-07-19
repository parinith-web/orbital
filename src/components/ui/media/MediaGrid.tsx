"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";
import { formatFileSize } from "@/lib/utils/file";

export interface MediaItemProps {
  fileUrl: string;
  fileName?: string;
  fileSize?: number;
  type: string;
  onClick?: () => void;
}

export function MediaItem({
  fileUrl,
  fileName,
  fileSize,
  type,
  onClick,
}: MediaItemProps) {
  const isVideo = type.startsWith("video/");
  const isFile = !type.startsWith("image/") && !type.startsWith("video/");

  if (isFile) {
    return (
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 p-2 hover:bg-theme-border rounded-lg transition-all"
      >
        <div className="w-10 h-10 rounded-lg bg-theme-base flex items-center justify-center border border-white/5">
          <HugeiconsIcon icon={File02Icon} className="w-5 h-5 text-white/40" />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm text-gray-300 truncate">{fileName}</span>
          {fileSize && (
            <span className="text-[10px] text-gray-400">
              {formatFileSize(fileSize)}
            </span>
          )}
        </div>
      </a>
    );
  }

  return (
    <div
      onClick={onClick}
      className="aspect-square relative rounded-lg overflow-hidden bg-theme-surface group cursor-pointer border border-theme-border"
    >
      {isVideo ? (
        <video
          src={fileUrl}
          className="w-full h-full object-cover"
          preload="metadata"
        />
      ) : (
        <Image
          src={fileUrl}
          quality={40}
          alt="media"
          fill
          sizes="100px"
          className="object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        />
      )}
    </div>
  );
}

export interface MediaGridProps {
  items: Array<{
    _id: string;
    file_url: string;
    file_name?: string;
    file_size?: number;
    type: string;
  }>;
  onItemClick?: (item: any) => void;
  className?: string;
}

export function MediaGrid({ items, onItemClick, className }: MediaGridProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn("grid grid-cols-3 gap-2", className)}>
      {items.map((item) => (
        <MediaItem
          key={item._id}
          fileUrl={item.file_url}
          fileName={item.file_name}
          fileSize={item.file_size}
          type={item.type}
          onClick={() => onItemClick?.(item)}
        />
      ))}
    </div>
  );
}
