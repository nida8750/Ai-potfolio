import { cn } from "@/lib/utils";

interface GlowOrbProps {
  className?: string;
  color?: "purple" | "blue";
}

export function GlowOrb({ className, color = "purple" }: GlowOrbProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl animate-orb",
        color === "purple" && "bg-purple/25",
        color === "blue" && "bg-blue/20",
        className,
      )}
    />
  );
}
