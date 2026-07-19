import React from "react";


interface TypingIndicatorProps {
  typingUsers: { username: string }[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-6 pl-4 md:pl-10">
      <div className="w-10 h-10 rounded-[12px] border border-[#2a2a2a] flex items-center justify-center bg-theme-surface">
        <span className="flex gap-1">
          <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce"></span>
        </span>
      </div>
      <span className="text-xs text-white/50 italic">
        {typingUsers
          .filter(Boolean)
          .map((typingUser) => typingUser?.username)
          .filter(Boolean)
          .join(", ")} 
        {typingUsers.length === 1 ? "is" : "are"} typing...
      </span>
    </div>
  );
}
