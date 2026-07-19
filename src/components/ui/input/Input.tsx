import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  inputSize?: "sm" | "md";
  rightElement?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, label, error, inputSize = "md", rightElement, ...props },
    ref,
  ) => {
    return (
      <div className="flex flex-col gap-2">
        {label && <span className="text-xs text-white/60">{label}</span>}
        <div className="relative">
          <input
            className={cn(
              "outline-none border border-theme-border rounded-xl text-[#e3e3e3] bg-theme-hover w-full placeholder-[#c7c7c7] disabled:opacity-70",
              inputSize === "sm" ? "py-2 px-3 text-sm" : "py-2 px-3 text-sm",
              rightElement ? "pr-10" : "",
              error && "border-red-500",
              className,
            )}
            ref={ref}
            autoComplete="off"
            {...props}
          />
          {rightElement && (
            <div className="absolute right-0 top-1/2 -translate-y-1/2">
              {rightElement}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  },
);
Input.displayName = "Input";

export { Input };
