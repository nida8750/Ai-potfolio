import { AiOpsCard } from "@/components/admin/AiOpsCard";
import { SupabaseConsoleCard } from "@/components/admin/SupabaseConsoleCard";
import { DashboardDetailPanel } from "@/components/app/DashboardDetailPanel";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { fetchBackendHealth, fetchUserAiOverview } from "@/lib/api/backend-health";
import { requireAuthOrRedirect } from "@/lib/auth/guards";

type AiDetail = "conversations" | "knowledge" | "runs";

function asDetail(value: string | string[] | undefined): AiDetail {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "knowledge" || raw === "runs" || raw === "conversations") {
    return raw;
  }
  return "conversations";
}

function activityRows(items: unknown[]): Array<{
  id: string;
  status: string;
  when: string;
}> {
  return (items ?? []).slice(0, 8).flatMap((item, index) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const row = item as {
      id?: string;
      status?: string;
      created_at?: string;
      completed_at?: string;
    };
    return [
      {
        id: row.id ?? `run-${index}`,
        status: row.status ?? "unknown",
        when: row.created_at ?? row.completed_at ?? "—",
      },
    ];
  });
}

export default async function DashboardAiPage({
  searchParams,
}: PageProps<"/dashboard/ai">) {
  await requireAuthOrRedirect("/dashboard/ai");
  const params = await searchParams;
  const detail = asDetail(params.detail);
  const [fastapi, overview] = await Promise.all([
    fetchBackendHealth(),
    fetchUserAiOverview(),
  ]);
  const runs = activityRows(overview?.recent_agent_activity ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI platform"
        description="Click a count to see the stored records behind it."
      />
      <SupabaseConsoleCard />
      <AiOpsCard llm={overview?.llm} tokens={overview?.token_usage} />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Conversations"
          value={overview?.total_conversations ?? 0}
          href="/dashboard/ai?detail=conversations#dashboard-details"
          selected={detail === "conversations"}
        />
        <StatCard
          label="Knowledge bases"
          value={overview?.total_knowledge_bases ?? 0}
          href="/dashboard/ai?detail=knowledge#dashboard-details"
          selected={detail === "knowledge"}
        />
        <StatCard
          label="Documents"
          value={overview?.total_documents ?? 0}
          href="/dashboard/ai?detail=knowledge#dashboard-details"
          selected={detail === "knowledge"}
        />
        <StatCard
          label="Successful runs"
          value={overview?.successful_runs ?? 0}
          href="/dashboard/ai?detail=runs#dashboard-details"
          selected={detail === "runs"}
        />
      </div>

      {detail === "conversations" ? (
        <DashboardDetailPanel
          title="Conversations"
          description="Your stored conversation count from FastAPI. Zero means none have been saved yet."
          empty="No conversations recorded for this account."
          count={overview?.total_conversations ?? 0}
        >
          <p className="text-sm text-muted">
            {overview?.total_conversations ?? 0} conversation
            {(overview?.total_conversations ?? 0) === 1 ? "" : "s"} on record.
          </p>
        </DashboardDetailPanel>
      ) : null}

      {detail === "knowledge" ? (
        <DashboardDetailPanel
          title="Knowledge"
          description="Knowledge bases and documents stored for your account."
          empty="No knowledge bases or documents recorded yet."
          count={
            (overview?.total_knowledge_bases ?? 0) + (overview?.total_documents ?? 0)
          }
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 px-3 py-2">
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Knowledge bases
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {overview?.total_knowledge_bases ?? 0}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 px-3 py-2">
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Documents
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {overview?.total_documents ?? 0}
              </dd>
            </div>
          </dl>
        </DashboardDetailPanel>
      ) : null}

      {detail === "runs" ? (
        <DashboardDetailPanel
          title="Agent runs"
          description="Stored runs for your conversations only."
          empty="No agent runs recorded yet."
          count={runs.length}
        >
          <ul className="space-y-2 text-sm">
            {runs.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-4 py-3"
              >
                <span className="text-foreground">{row.status}</span>
                <span className="text-muted">{row.when}</span>
              </li>
            ))}
          </ul>
        </DashboardDetailPanel>
      ) : null}

      <GlassCard className="p-5">
        <p className="text-sm text-muted">
          {fastapi.reachable
            ? `${fastapi.service ?? "FastAPI"} is reachable (phase ${fastapi.phase ?? "—"}).`
            : "FastAPI is not reachable from this Next.js server."}
        </p>
        {fastapi.checks ? (
          <dl className="mt-4 space-y-2">
            {Object.entries(fastapi.checks).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <dt className="capitalize text-muted">{key}</dt>
                <dd className="text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </GlassCard>
    </div>
  );
}
