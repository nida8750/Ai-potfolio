import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-surface/80 p-5 shadow-[0_8px_40px_rgb(0_0_0_/_0.28)] backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </div>
  );
}
