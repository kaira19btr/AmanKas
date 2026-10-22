"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const gradientButtonVariants = cva(
  [
    "gradient-button",
    "inline-flex items-center justify-center gap-2",
    "rounded-[11px] font-sans font-bold",
    "cursor-pointer select-none transition-all duration-300",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#009770]/60 focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.98]",
  ],
  {
    variants: {
      variant: {
        default: "",
        variant: "gradient-button-variant",
        destructive: "gradient-button-destructive",
        outline: "gradient-button-outline",
        vanilla: "gradient-button-vanilla",
        ghost: "gradient-button-ghost",
      },
      size: {
        default: "min-w-[132px] px-8 py-3.5 text-sm md:text-base leading-[19px]",
        sm: "min-w-[90px] px-3.5 py-1.5 text-xs font-semibold rounded-lg",
        md: "min-w-[110px] px-5 py-2.5 text-xs md:text-sm font-semibold rounded-lg",
        lg: "min-w-[140px] px-9 py-4 text-base leading-[19px] rounded-[12px]",
        full: "w-full px-6 py-3.5 text-sm md:text-base leading-[19px] rounded-xl",
        icon: "min-w-0 w-9 h-9 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface GradientButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof gradientButtonVariants> {
  asChild?: boolean;
}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(gradientButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
GradientButton.displayName = "GradientButton";

export { GradientButton, gradientButtonVariants };
