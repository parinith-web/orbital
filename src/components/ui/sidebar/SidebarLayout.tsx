"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SidebarLayoutProps {
  children: React.ReactNode;
  className?: string;
  /** Which edge of the screen the sidebar is docked to. Defaults to "right". */
  side?: "left" | "right";
}

export function SidebarLayout({
  children,
  className,
  side = "right",
}: SidebarLayoutProps) {
  return (
    <div
      className={cn(
        "fixed md:static top-0 z-[100] w-full md:w-[320px] h-full bg-theme-base border-theme-border flex flex-col",
        side === "left"
          ? "left-0 md:border-r"
          : "right-0 md:border-l",
        className,
      )}
    >
      {children}
    </div>
  );
}

export { SidebarHeader } from "./SidebarHeader";
export { SidebarFooter } from "./SidebarFooter";
