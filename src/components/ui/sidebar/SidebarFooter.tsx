"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SidebarFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarFooter({ children, className }: SidebarFooterProps) {
  return (
    <div className={cn("shrink-0 border-t border-theme-border/50 px-4 py-4 text-sm bg-theme-base", className)}>
      {children}
    </div>
  );
}