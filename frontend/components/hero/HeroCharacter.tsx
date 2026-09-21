import { cn } from "@/lib/utils";

export interface HeroCharacterProps {
  className?: string;
}

export function HeroCharacter({ className }: HeroCharacterProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative mx-auto aspect-square w-full max-w-[280px] xs:max-w-[320px] md:max-w-[380px]",
        className,
      )}
    >
      <svg viewBox="0 0 400 400" className="h-full w-full">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#F8FAFC" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#8B5CF6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="ringStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>
          <pattern
            id="coreGrid"
            width="22"
            height="22"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 22 0 L 0 0 0 22"
              fill="none"
              stroke="#94A3B8"
              strokeOpacity="0.12"
            />
          </pattern>
        </defs>

        <circle cx="200" cy="200" r="168" fill="url(#coreGrid)" />
        <circle
          cx="200"
          cy="200"
          r="168"
          fill="none"
          stroke="#8B5CF6"
          strokeOpacity="0.18"
        />
        <circle
          className="origin-center motion-safe:animate-orb"
          cx="200"
          cy="200"
          r="128"
          fill="none"
          stroke="url(#ringStroke)"
          strokeOpacity="0.55"
          strokeWidth="1.4"
        />
        <circle
          cx="200"
          cy="200"
          r="88"
          fill="none"
          stroke="#38BDF8"
          strokeOpacity="0.4"
          strokeDasharray="6 10"
        />
        <circle cx="200" cy="200" r="42" fill="url(#coreGlow)" />
        <circle cx="200" cy="200" r="10" fill="#F8FAFC" />

        <line
          x1="200"
          y1="72"
          x2="200"
          y2="112"
          stroke="#8B5CF6"
          strokeOpacity="0.55"
        />
        <line
          x1="200"
          y1="288"
          x2="200"
          y2="328"
          stroke="#38BDF8"
          strokeOpacity="0.45"
        />
        <line
          x1="72"
          y1="200"
          x2="112"
          y2="200"
          stroke="#38BDF8"
          strokeOpacity="0.45"
        />
        <line
          x1="288"
          y1="200"
          x2="328"
          y2="200"
          stroke="#8B5CF6"
          strokeOpacity="0.5"
        />

        <circle cx="200" cy="64" r="5" fill="#8B5CF6" />
        <circle cx="328" cy="200" r="4.5" fill="#38BDF8" />
        <circle cx="200" cy="336" r="5" fill="#38BDF8" />
        <circle cx="72" cy="200" r="4.5" fill="#8B5CF6" />
        <circle cx="286" cy="114" r="3.5" fill="#C4B5FD" />
        <circle cx="114" cy="286" r="3.5" fill="#7DD3FC" />
      </svg>
    </div>
  );
}
