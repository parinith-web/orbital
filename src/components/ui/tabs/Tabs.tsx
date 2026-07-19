"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs(props: TabsProps) {
  const { defaultValue, value, onValueChange, children, className, ...rest } =
    props;
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
    <div className={cn("flex flex-col h-full", className)} {...rest}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab,
            onTabChange: handleTabChange,
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
  className?: string;
}

export function TabsList({
  children,
  activeTab,
  onTabChange,
  className,
}: TabsListProps) {
  return (
    <div
      className={cn(
        "bg-theme-surface text-sm text-gray-200 h-9 rounded-[8px] w-fit p-1 flex items-center gap-1",
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
  className?: string;
}

export function TabsTrigger({
  value,
  isActive,
  onClick,
  className,
}: TabsTriggerProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1 rounded-[6px] text-sm text-gray-200 transition-colors",
        isActive ? "bg-theme-hover" : "hover:bg-theme-hover",
        className,
      )}
    >
      {value.charAt(0).toUpperCase() + value.slice(1)}
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
