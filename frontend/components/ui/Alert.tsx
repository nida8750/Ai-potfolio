import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const toneClasses = {
  info: "border-accent/30 bg-accent/10 text-accent",
  success: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  error: "border-red-400/30 bg-red-400/10 text-red-200",
  warning: "border-amber-400/30 bg-amber-400/10 text-amber-200",
} as const;

interface AlertProps {
  tone?: keyof typeof toneClasses;
  children: ReactNode;
  className?: string;
}

export function Alert({ tone = "info", children, className }: AlertProps) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-xl border px-3 py-2.5 text-sm leading-6",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}
