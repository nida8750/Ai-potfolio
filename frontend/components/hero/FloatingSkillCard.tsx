import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";

interface FloatingSkillCardProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  position?: string;
  className?: string;
}

export function FloatingSkillCard({
  title,
  subtitle,
  icon,
  position,
  className,
}: FloatingSkillCardProps) {
  return (
    <GlassCard
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 shadow-[0_10px_30px_rgb(5_8_22_/_0.45)]",
        position,
        className,
      )}
    >
      {icon ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        {subtitle ? (
          <span className="block text-xs text-muted">{subtitle}</span>
        ) : null}
      </span>
    </GlassCard>
  );
}
