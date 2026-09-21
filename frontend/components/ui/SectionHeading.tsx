import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  titleId?: string;
  /** Small decorative tile shown beside the title, as in the design. */
  icon?: ReactNode;
  action?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
  titleId,
  icon,
  action,
}: SectionHeadingProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span
            aria-hidden="true"
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary"
          >
            {icon}
          </span>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={titleId}
            className="font-display text-[1.6rem] leading-tight tracking-tight break-words text-foreground xs:text-[1.9rem] md:text-[2.15rem]"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted md:text-[0.95rem]">
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
