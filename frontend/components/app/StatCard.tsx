import Link from "next/link";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  hint?: string;
  href?: string;
  selected?: boolean;
}

export function StatCard({ label, value, hint, href, selected }: StatCardProps) {
  const className = cn(
    "rounded-2xl border bg-surface/60 p-4",
    selected ? "border-primary/50" : "border-white/10",
    href &&
      "block transition-colors hover:border-primary/40 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
  );

  const body = (
    <>
      <p className="text-xs uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className="mt-2 font-display text-2xl text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      {href ? (
        <p className="mt-2 text-xs text-accent">
          {selected ? "Showing details" : "View details"}
        </p>
      ) : null}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return <div className={className}>{body}</div>;
}
