import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const variantClasses = {
  default:
    "border-white/10 bg-white/[0.04] text-muted",
  purple: "border-primary/30 bg-primary/10 text-primary",
  blue: "border-accent/30 bg-accent/10 text-accent",
} as const;

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variantClasses;
}

export function Badge({
  children,
  className,
  variant = "default",
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-wide backdrop-blur-sm",
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
