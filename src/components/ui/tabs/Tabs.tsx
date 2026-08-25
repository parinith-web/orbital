"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  /**
   * "horizontal" (default) keeps the original pill-row behavior used by
   * SidebarMedia's images/videos/files tabs. "vertical" stacks the list
   * top-to-bottom, sidebar-nav style, and lays the whole Tabs root out as
   * a row (list column + content column) instead of a column — used by
   * the Friends page so its Chats/Friends/Requests/Find people switcher
   * reads like the LeftSidebar nav instead of a floating top pill.
   */
  orientation?: "horizontal" | "vertical";
}

export function Tabs(props: TabsProps) {
  const {
    defaultValue,
    value,
    onValueChange,
    orientation = "horizontal",
    children,
    className,
    ...rest
  } = props;
  const [activeValue, setActiveValue] = React.useState(defaultValue || "");

  const activeTab = value ?? activeValue;

  const handleTabChange = (newValue: string) => {
    if (onValueChange) {
      onValueChange(newValue);
    } else {
      setActiveValue(newValue);
    }
  };

  return (
    <div
      className={cn(
        orientation === "vertical" ? "flex flex-row h-full" : "flex flex-col h-full",
        className,
      )}
      {...rest}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab,
            onTabChange: handleTabChange,
            orientation,
          });
        }
        return child;
      })}
    </div>
  );
}

export interface TabsListProps {
  children: React.ReactNode;
  activeTab?: string;
  onTabChange?: (value: string) => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function TabsList({
  children,
  activeTab,
  onTabChange,
  orientation = "horizontal",
  className,
}: TabsListProps) {
  return (
    <div
      className={cn(
        orientation === "vertical"
          ? "flex-none bg-theme-surface text-sm text-gray-200 w-56 p-1 flex flex-col gap-1"
          : "bg-theme-surface text-sm text-gray-200 h-9 rounded-[8px] w-fit p-1 flex items-center gap-1",
        className,
      )}
    >
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isActive:
              activeTab === (child as React.ReactElement<any>).props.value,
            onClick: () =>
              onTabChange?.((child as React.ReactElement<any>).props.value),
            orientation,
          });
        }
        return child;
      })}
    </div>
  );
}

export interface TabsTriggerProps {
  value: string;
  isActive?: boolean;
  onClick?: () => void;
  orientation?: "horizontal" | "vertical";
  className?: string;
  /**
   * Session 6a (Friends) — optional custom label content, e.g. a tab label
   * plus a pending-count badge (`<>Requests <Badge/></>`). Falls back to
   * the auto-capitalized `value` text when omitted so every pre-existing
   * caller (SidebarMedia's images/videos/files tabs) renders identically.
   */
  children?: React.ReactNode;
}

export function TabsTrigger({
  value,
  isActive,
  onClick,
  orientation = "horizontal",
  className,
  children,
}: TabsTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        orientation === "vertical"
          ? "px-3 py-2 rounded-[8px] text-sm w-full transition-colors flex items-center gap-2 text-left"
          : "px-3 py-1 rounded-[6px] text-sm text-gray-200 transition-colors flex items-center gap-1.5",
        orientation === "vertical"
          ? isActive
            ? "bg-theme-hover text-white"
            : "text-gray-200 hover:bg-theme-hover hover:text-white"
          : isActive
            ? "bg-theme-hover"
            : "hover:bg-theme-hover",
        className,
      )}
    >
      {children ?? value.charAt(0).toUpperCase() + value.slice(1)}
    </button>
  );
}

export interface TabsContentProps {
  value: string;
  activeTab?: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({
  value,
  activeTab,
  className,
  children,
}: TabsContentProps) {
  if (value !== activeTab) return null;
  return (
    <div className={cn("flex-1 overflow-hidden", className)}>{children}</div>
  );
}
