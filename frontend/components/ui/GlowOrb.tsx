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
        "pointer-events-none absolute rounded-full blur-3xl motion-safe:animate-orb",
        color === "purple" && "bg-primary/25",
        color === "blue" && "bg-accent/20",
        className,
      )}
    />
  );
}
