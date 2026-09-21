import { GlowOrb } from "@/components/ui/GlowOrb";
import { GridBackground } from "@/components/ui/GridBackground";

export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <GridBackground />
      <div className="absolute right-[8%] top-[18%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgb(139_92_246_/_0.28),transparent_68%)]" />
      <div className="absolute left-[12%] bottom-[12%] h-64 w-64 rounded-full bg-[radial-gradient(circle,rgb(56_189_248_/_0.16),transparent_70%)]" />
      <GlowOrb
        color="purple"
        className="-left-24 top-8 h-72 w-72 md:left-8 md:h-96 md:w-96"
      />
      <GlowOrb
        color="blue"
        className="-right-16 top-32 h-64 w-64 md:right-10 md:h-80 md:w-80"
      />
    </div>
  );
}
