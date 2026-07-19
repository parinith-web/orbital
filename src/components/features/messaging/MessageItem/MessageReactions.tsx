import React from "react";
import { useToggleReaction } from "@/hooks/useToggleReaction";
import { toast } from "sonner";

interface Reaction {
  _id: string;
  user_id: string;
  emoji: string;
}

interface GroupedReaction {
  count: number;
  hasUserReacted: boolean;
  userIds: string[];
}

interface MessageReactionsProps {
  messageId: string;
  reactions: Reaction[];
  currentUserId: string;
}

function groupReactions(
  reactions: Reaction[],
  currentUserId: string,
): Record<string, GroupedReaction> {
  return reactions.reduce(
    (acc, reaction) => {
      const existing = acc[reaction.emoji];
      if (!existing) {
        acc[reaction.emoji] = {
          count: 1,
          hasUserReacted: reaction.user_id === currentUserId,
          userIds: [reaction.user_id],
        };
      } else {
        existing.count++;
        existing.userIds.push(reaction.user_id);
        if (reaction.user_id === currentUserId) {
          existing.hasUserReacted = true;
        }
      }
      return acc;
    },
    {} as Record<string, GroupedReaction>,
  );
}

export const MessageReactions = ({
  messageId,
  reactions,
  currentUserId,
}: MessageReactionsProps) => {
  const toggleReaction = useToggleReaction();

  const groupedReactions = React.useMemo(
    () => groupReactions(reactions || [], currentUserId),
    [reactions, currentUserId],
  );

  if (!reactions || reactions.length === 0) return null;

  const handleReactionClick = async (emoji: string) => {
    const result = await toggleReaction(messageId, emoji);
    if (!result.success && result.error) {
      toast.error(result.error);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-1">
      {Object.entries(groupedReactions).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji)}
          className={`${data.hasUserReacted ? "bg-theme-accent text-theme-text border border-theme-hover" : "bg-theme-surface hover:bg-theme-base border border-theme-border  text-gray-400"} flex items-center gap-1 px-2 py-0.5 transition-all duration-100 rounded-md text-xs`}
          title={emoji}
        >
          <span className="text-sm">{emoji}</span>
          {data.count > 0 && (
            <span
              className={data.hasUserReacted ? "text-theme-text" : "text-gray-400"}
            >
              {data.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};
