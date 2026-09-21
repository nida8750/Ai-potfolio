import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  titleId?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  titleId,
}: SectionHeadingProps) {
  return (
    <header className={cn("max-w-3xl", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={titleId}
        className="mt-3 font-display text-[1.65rem] leading-tight tracking-tight break-words text-foreground xs:text-3xl md:text-4xl lg:text-[2.6rem]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted md:text-base">
          {description}
        </p>
      ) : null}
    </header>
  );
}
