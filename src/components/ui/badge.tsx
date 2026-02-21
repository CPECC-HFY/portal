import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center border font-medium transition-colors select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        success: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-400",
        info: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-400",
        outline: "border-border/60 text-foreground bg-transparent",
        ghost: "border-transparent bg-muted/60 text-muted-foreground",
      },
      size: {
        xs: "rounded px-1.5 py-px text-[9px] tracking-wider uppercase gap-1",
        sm: "rounded-md px-2 py-0.5 text-[10px] tracking-wide uppercase gap-1",
        md: "rounded-full px-2.5 py-0.5 text-xs gap-1.5",
        lg: "rounded-full px-3 py-1 text-sm gap-1.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

interface BadgeProps extends React.ComponentProps<"span">, VariantProps<typeof badgeVariants> {
  asChild?: boolean;
}

function Badge({ className, variant, size, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot : "span";

  return <Comp className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { Badge, badgeVariants, type BadgeProps };
