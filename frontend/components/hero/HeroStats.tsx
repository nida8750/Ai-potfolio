import { HERO_STATS } from "@/lib/constants";

export function HeroStats() {
  return (
    <ul className="mt-8 grid grid-cols-1 gap-3 xs:grid-cols-3">
      {HERO_STATS.map((stat) => (
        <li
          key={stat.label}
          className="rounded-xl border border-white/10 bg-secondary/70 px-3 py-3 text-center"
        >
          <p className="text-sm font-semibold text-ink">{stat.label}</p>
        </li>
      ))}
    </ul>
  );
}
