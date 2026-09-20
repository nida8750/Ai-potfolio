import { GlowOrb } from "@/components/ui/GlowOrb";
import { GridBackground } from "@/components/ui/GridBackground";

export function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <GridBackground />
      <GlowOrb
        color="purple"
        className="-left-24 top-10 h-72 w-72 md:left-10 md:h-96 md:w-96"
      />
      <GlowOrb
        color="blue"
        className="-right-16 top-40 h-64 w-64 md:right-20 md:h-80 md:w-80"
      />
    </div>
  );
}
