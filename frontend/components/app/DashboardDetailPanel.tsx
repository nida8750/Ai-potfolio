import Link from "next/link";
import type { ReactNode } from "react";
import { GlassCard } from "@/components/ui/GlassCard";

interface DashboardDetailPanelProps {
  title: string;
  description?: string;
  empty: string;
  count: number;
  moreHref?: string;
  moreLabel?: string;
  children: ReactNode;
}

export function DashboardDetailPanel({
  title,
  description,
  empty,
  count,
  moreHref,
  moreLabel = "Open full list",
  children,
}: DashboardDetailPanelProps) {
  return (
    <div id="dashboard-details">
      <GlassCard className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-lg text-foreground">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {moreHref ? (
            <Link
              href={moreHref}
              className="text-sm text-accent hover:text-foreground"
            >
              {moreLabel}
            </Link>
          ) : null}
        </div>
        {count === 0 ? (
          <p className="mt-4 text-sm text-muted">{empty}</p>
        ) : (
          <div className="mt-4">{children}</div>
        )}
      </GlassCard>
    </div>
  );
}
