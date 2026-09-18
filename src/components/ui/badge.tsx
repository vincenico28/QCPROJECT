import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-colors focus:outline-hidden focus:ring-2 focus:ring-ring",
  {
    variants: {
      variant: {
        default:
          "border border-primary/20 bg-primary/10 text-primary shadow-xs",
        secondary:
          "border border-border bg-secondary text-secondary-foreground",
        destructive:
          "border border-destructive/30 bg-destructive/15 text-destructive",
        outline:
          "border border-border text-foreground bg-card/60",
        brand:
          "border border-brand-surface-foreground/30 bg-brand-surface text-brand-surface-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
