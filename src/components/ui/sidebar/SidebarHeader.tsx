"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon } from "@hugeicons/core-free-icons";

export interface SidebarHeaderProps {
  title: string;
  onClose?: () => void;
  className?: string;
}

export function SidebarHeader({ title, onClose, className }: SidebarHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between p-2 border-b border-theme-border", className)}>
      <span className="text-sm text-gray-200 px-2">{title}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 hover:bg-theme-hover rounded-xl text-gray-400 hover:text-white transition-colors"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}