"use client";



export const TypingIndicatorMock = ({ 
  name = "Sam", 
  className 
}: { 
  name?: string; 
  avatar?: string; 
  className?: string 
}) => (
  <div className={`flex items-center gap-2 w-fit ${className}`}>
    <div className="w-10 h-10 rounded-[12px] border border-[#2a2a2a] flex items-center justify-center bg-[#1a1a1a]">
      <span className="flex gap-1">
        <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
        <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce"></span>
      </span>
    </div>
    <span className="text-xs text-white/50 italic">
      {name} is typing...
    </span>
  </div>
);
