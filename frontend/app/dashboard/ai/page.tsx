import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { fetchBackendHealth, fetchUserAiOverview } from "@/lib/api/backend-health";
import { requireAuthOrRedirect } from "@/lib/auth/guards";

export default async function DashboardAiPage() {
  await requireAuthOrRedirect("/dashboard/ai");
  const [fastapi, overview] = await Promise.all([
    fetchBackendHealth(),
    fetchUserAiOverview(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI platform"
        description="Live status of the FastAPI backend that powers agents, RAG, and automation."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Conversations" value={overview?.total_conversations ?? 0} />
        <StatCard label="Knowledge bases" value={overview?.total_knowledge_bases ?? 0} />
        <StatCard label="Documents" value={overview?.total_documents ?? 0} />
        <StatCard label="Successful runs" value={overview?.successful_runs ?? 0} />
      </div>
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
