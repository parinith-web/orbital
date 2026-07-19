"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface UseSearchMessagesOptions {
  conversationId: string;
  query: string;
}

export function useSearchMessages({ conversationId, query }: UseSearchMessagesOptions) {
  const results = useQuery(api.messages.searchMessages, { conversation_id: conversationId, query });
  return {
    results: results ?? [],
    isLoading: results === undefined,
  };
}