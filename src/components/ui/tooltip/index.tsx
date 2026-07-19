"use client";

import React from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./Tooltip";

interface TooltipWrapperProps extends Omit<React.ComponentPropsWithoutRef<typeof TooltipTrigger>, "content"> {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
}


export const TooltipWrapper = React.forwardRef<HTMLButtonElement, TooltipWrapperProps>(
  (
    {
      children,
      content,
      side = "top",
      align = "center",
      delayDuration = 200,
      ...props
    },
    ref
  ) => {
    if (!content) return <>{children}</>;

    return (
      <Tooltip delayDuration={delayDuration}>
        <TooltipTrigger asChild ref={ref} {...props}>
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} align={align}>
          {content}
        </TooltipContent>
      </Tooltip>
    );
  }
);

TooltipWrapper.displayName = "TooltipWrapper";



export { TooltipProvider };
