import { GridBackground } from "@/components/ui/GridBackground";

export function HeroBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <GridBackground />
      <div className="absolute right-[6%] top-[12%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgb(124_58_237_/_0.22),transparent_68%)] blur-2xl" />
    </div>
  );
}
