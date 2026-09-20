import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  children: ReactNode;
  className?: string;
}

export function GlowCard({ children, className }: GlowCardProps) {
  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-white/10 bg-surface/90 p-6 transition-transform duration-300",
        "hover:-translate-y-1 hover:border-purple/50 hover:shadow-[0_0_0_1px_rgb(139_92_246_/_0.25),0_20px_50px_rgb(139_92_246_/_0.12)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
