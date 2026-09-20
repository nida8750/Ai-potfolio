import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  titleId?: string;
  children?: ReactNode;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  titleId,
  children,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue">
          {eyebrow}
        </p>
      ) : null}
      <h2
        id={titleId}
        className="mt-3 font-display text-[1.65rem] leading-tight tracking-tight text-ink xs:text-3xl md:text-4xl lg:text-[2.6rem]"
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-2xl text-sm leading-7 text-muted md:text-base">
          {description}
        </p>
      ) : null}
      {children}
    </div>
  );
}
