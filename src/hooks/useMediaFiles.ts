"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UseMediaFilesOptions {
  conversationId: string;
}

export function useMediaFiles({ conversationId }: UseMediaFilesOptions) {
  const mediaFiles = useQuery(api.messages.getMedia, { conversation_id: conversationId });
  return {
    mediaFiles: mediaFiles ?? [],
    isLoading: mediaFiles === undefined,
  };
}