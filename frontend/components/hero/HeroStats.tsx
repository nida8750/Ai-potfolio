import { HERO_STATS } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface HeroStatsProps {
  className?: string;
}

export function HeroStats({ className }: HeroStatsProps) {
  return (
    <ul className={cn("grid grid-cols-3 gap-2.5 xs:gap-3", className)}>
      {HERO_STATS.map((stat) => (
        <li
          key={stat.label}
          className="rounded-xl border border-white/10 bg-surface/70 px-2.5 py-3 backdrop-blur-sm xs:px-3.5"
        >
          <p className="font-display text-lg text-foreground xs:text-xl">
            {stat.value}
          </p>
          <p className="mt-0.5 text-[11px] leading-tight text-muted xs:text-xs">
            {stat.label}
          </p>
        </li>
      ))}
    </ul>
  );
}
