import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useColor } from "@/contexts/colorContext";

const buttonVariants = cva(
  "inline-flex items-center justify-center outline-none rounded-xl font-regular transition-all duration-200 ease-in-out focus:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "hover:text-white/80",
        secondary:
          "border border-theme-border hover:bg-theme-border hover:text-white/90 text-white",
        other:
          "bg-theme-border hover:bg-theme-hover text-white hover:text-white/90",
        destructive: "bg-[#ae4447] hover:bg-[#ae4447]/80 text-white",
        destructive2: "bg-red-500/5 hover:bg-red-500/10 text-red-300",
        ghost: "hover:bg-theme-border text-white",
      },
      size: {
        sm: "py-1 px-3 text-sm",
        md: "py-2 px-4 text-sm",
        lg: "py-2 px-6 text-base",
        iconSm: "p-1.5 text-sm",
        iconMd: "p-2 text-base",
        iconLg: "p-4 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

import { TooltipWrapper } from "@/components/ui/tooltip";

export interface ButtonProps
  extends
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  loading?: boolean;
  tooltip?: string;
  tooltipSide?: "top" | "right" | "bottom" | "left";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, loading, children, disabled, style, tooltip, tooltipSide, ...props },
    ref,
  ) => {
    const { color, textColor } = useColor();

    const variantStyle =
      variant === "primary"
        ? { backgroundColor: color, color: textColor }
        : undefined;

    const button = (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        style={{ ...variantStyle, ...style }}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? "Loading..." : children}
      </button>
    );

    if (tooltip) {
      return (
        <TooltipWrapper content={tooltip} side={tooltipSide}>
          {button}
        </TooltipWrapper>
      );
    }

    return button;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
