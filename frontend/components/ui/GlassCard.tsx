import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({
  children,
  className,
  hover = false,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-surface/70 p-5 shadow-[0_8px_40px_rgb(0_0_0_/_0.28)] backdrop-blur-xl",
        hover &&
          "transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/45 hover:shadow-[0_0_0_1px_rgb(139_92_246_/_0.22),0_18px_40px_rgb(139_92_246_/_0.12)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
