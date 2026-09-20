import { GlassCard } from "@/components/ui/GlassCard";
import { ServiceIcon } from "@/components/services/ServiceIcon";
import { cn } from "@/lib/utils";

interface FloatingSkillCardProps {
  label: string;
  icon: string;
  className?: string;
}

export function FloatingSkillCard({
  label,
  icon,
  className,
}: FloatingSkillCardProps) {
  return (
    <GlassCard
      className={cn(
        "flex items-center gap-2.5 px-3 py-2.5 shadow-[0_10px_30px_rgb(5_8_22_/_0.45)]",
        className,
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple/15 text-purple">
        <ServiceIcon name={icon} className="h-4 w-4" />
      </span>
      <span className="text-sm font-medium text-ink">{label}</span>
    </GlassCard>
  );
}
