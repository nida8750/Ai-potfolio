import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AnimatedBorderProps {
  children: ReactNode;
  className?: string;
}

export function AnimatedBorder({ children, className }: AnimatedBorderProps) {
  return (
    <div className={cn("relative rounded-2xl p-[1px]", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
      >
        <div className="absolute top-1/2 left-1/2 h-[220%] w-[220%] -translate-x-1/2 -translate-y-1/2 bg-[conic-gradient(from_180deg,transparent_0deg,#8B5CF6_80deg,transparent_140deg,#38BDF8_220deg,transparent_300deg)] opacity-70 motion-safe:animate-border-spin" />
      </div>
      <div className="relative rounded-2xl bg-surface">{children}</div>
    </div>
  );
}
