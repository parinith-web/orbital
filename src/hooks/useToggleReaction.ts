import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export const useToggleReaction = () => {
  const toggle = useMutation(api.reactions.toggleReaction);
  return (messageId: string, emoji: string) => {
    return toggle({
      messageId: messageId as Id<"messages">,
      emoji,
    });
  };
};
