import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success: "border-transparent bg-success/10 text-success border-success/20",
        warning: "border-transparent bg-warning/10 text-warning border-warning/20",
        info: "border-transparent bg-info/10 text-info border-info/20",
        // Priority badges
        "priority-low": "border-transparent bg-priority-low/10 text-priority-low",
        "priority-medium": "border-transparent bg-priority-medium/10 text-priority-medium",
        "priority-high": "border-transparent bg-priority-high/10 text-priority-high",
        "priority-urgent": "border-transparent bg-priority-urgent/10 text-priority-urgent",
        // Status badges
        "status-todo": "border-transparent bg-status-todo/10 text-status-todo",
        "status-progress": "border-transparent bg-status-progress/10 text-status-progress",
        "status-completed": "border-transparent bg-status-completed/10 text-status-completed",
        "status-hold": "border-transparent bg-status-hold/10 text-status-hold",
        // Role badges
        parent: "border-transparent bg-accent/10 text-accent",
        driver: "border-transparent bg-info/10 text-info",
        chef: "border-transparent bg-priority-high/10 text-priority-high",
        cleaner: "border-transparent bg-success/10 text-success",
        other: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
