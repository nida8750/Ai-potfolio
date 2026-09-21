import { HERO_STATS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface HeroStatsProps {
  className?: string;
}

export function HeroStats({ className }: HeroStatsProps) {
  return (
    <ul className={cn("grid grid-cols-1 gap-3 xs:grid-cols-3", className)}>
      {HERO_STATS.map((stat) => (
        <li
          key={stat.label}
          className="rounded-xl border border-white/10 bg-surface-secondary/80 px-3 py-3 text-center"
        >
          <p className="text-sm font-semibold text-foreground">{stat.label}</p>
        </li>
      ))}
    </ul>
  );
}
