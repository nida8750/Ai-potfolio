import { StatCard } from "@/components/app/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import type { LlmOps, TokenUsageTotals } from "@/lib/api/backend-types";

interface AiOpsCardProps {
  llm?: LlmOps;
  tokens?: TokenUsageTotals;
  detailsHref?: string;
}

export function AiOpsCard({ llm, tokens, detailsHref }: AiOpsCardProps) {
  const configured = Boolean(llm?.configured);
  const usage = tokens ?? {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0,
    records_with_usage: 0,
  };

  return (
    <GlassCard className="p-5">
      <h2 className="font-display text-lg text-foreground">Model and tokens</h2>
      <p className="mt-1 text-sm text-muted">
        Values come from the live FastAPI config and stored{" "}
        <code className="text-foreground">token_usage</code> rows. Empty
        platform stays at zero — nothing is estimated.
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 px-3 py-2">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">LLM</dt>
          <dd className="mt-1 text-sm text-foreground">
            {configured ? "Configured" : "Not configured"}
          </dd>
        </div>
        <div className="rounded-xl border border-white/10 px-3 py-2">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Model</dt>
          <dd className="mt-1 text-sm text-foreground">{llm?.model ?? "—"}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-3 py-2">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Provider</dt>
          <dd className="mt-1 text-sm text-foreground">{llm?.provider ?? "—"}</dd>
        </div>
        <div className="rounded-xl border border-white/10 px-3 py-2">
          <dt className="text-xs uppercase tracking-[0.14em] text-muted">Router</dt>
          <dd className="mt-1 text-sm text-foreground">{llm?.router ?? "heuristic"}</dd>
        </div>
      </dl>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Prompt tokens"
          value={usage.prompt_tokens}
          href={detailsHref}
        />
        <StatCard
          label="Completion tokens"
          value={usage.completion_tokens}
          href={detailsHref}
        />
        <StatCard
          label="Total tokens"
          value={usage.total_tokens}
          href={detailsHref}
        />
        <StatCard
          label="Usage records"
          value={usage.records_with_usage}
          hint="Messages or runs that stored token_usage"
          href={detailsHref}
        />
      </div>
    </GlassCard>
  );
}
