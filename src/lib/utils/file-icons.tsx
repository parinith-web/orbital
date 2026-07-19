"use client";

import {
  Image02Icon as FileImage,
  Video01Icon as FileVideo,
  MusicNote01Icon as FileAudio,
  File02Icon as FileText,
  FileZipIcon as FileArchive,
  CodeIcon as FileCode,
  File02Icon as FileIcon,
  Pdf01Icon as FilePdf
} from "@hugeicons/core-free-icons";

export function getFileIcon(fileType: string) {
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType.startsWith("video/")) return FileVideo;
  if (fileType.startsWith("audio/")) return FileAudio;

  const typeMap: Record<string, any> = {
    "application/pdf": FilePdf,
    "application/zip": FileArchive,
    "application/x-zip-compressed": FileArchive,
    "text/plain": FileText,
    "text/html": FileCode,
    "text/css": FileCode,
    "application/javascript": FileCode,
    "application/json": FileCode,
  };

  return typeMap[fileType] || FileIcon;
}
