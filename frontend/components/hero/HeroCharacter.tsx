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
        className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_50%_42%,rgb(124_58_237_/_0.28),rgb(56_189_248_/_0.08)_42%,transparent_68%)] blur-2xl"
      />
      <Image
        src={HERO_CHARACTER}
        alt={decorative ? "" : `Illustration of ${PERSON_NAME}`}
        aria-hidden={decorative || undefined}
        width={1024}
        height={1024}
        priority={priority}
        sizes="(max-width: 1023px) 80vw, 420px"
        className="h-auto w-full [mask-image:radial-gradient(circle_at_50%_42%,black_68%,transparent_84%)]"
      />
    </div>
  );
}
