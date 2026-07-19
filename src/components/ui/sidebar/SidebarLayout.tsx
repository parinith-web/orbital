"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SidebarLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarLayout({ children, className }: SidebarLayoutProps) {
  return (
    <div
      className={cn(
        "fixed md:static top-0 right-0 z-[100] w-full md:w-[320px] h-full bg-theme-base md:border-l border-theme-border flex flex-col",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { SidebarHeader } from "./SidebarHeader";
export { SidebarFooter } from "./SidebarFooter";
