import Image from "next/image";
import { HERO_CHARACTER, PERSON_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

export interface HeroCharacterProps {
  className?: string;
  priority?: boolean;
  /** Decorative repeats of the portrait skip the alt text. */
  decorative?: boolean;
}

export function HeroCharacter({
  className,
  priority = false,
  decorative = false,
}: HeroCharacterProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[460px]", className)}>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_50%_45%,rgb(139_92_246_/_0.38),transparent_62%)] blur-2xl"
      />
      <Image
        src={HERO_CHARACTER}
        alt={decorative ? "" : `Illustration of ${PERSON_NAME}`}
        aria-hidden={decorative || undefined}
        width={1024}
        height={1024}
        priority={priority}
        sizes="(max-width: 1023px) 80vw, 420px"
        className="h-auto w-full [mask-image:radial-gradient(circle_at_50%_48%,black_62%,transparent_78%)]"
      />
    </div>
  );
}
