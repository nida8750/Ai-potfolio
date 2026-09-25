import { AiOpsCard } from "@/components/admin/AiOpsCard";
import { SupabaseConsoleCard } from "@/components/admin/SupabaseConsoleCard";
import { PageHeader } from "@/components/app/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { backendInternalGet, fetchBackendHealth } from "@/lib/api/backend-health";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import type { DashboardOverview } from "@/lib/api/backend-types";

export default async function AdminAiPage() {
  await requireAdminOrRedirect("/admin/ai");
  const fastapi = await fetchBackendHealth();
  const [agents, overview] = fastapi.reachable
    ? await Promise.all([
        backendInternalGet<{ agents?: Array<{ name?: string; slug?: string }> }>(
          "/api/v1/internal/agents",
        ),
        backendInternalGet<DashboardOverview>("/api/v1/internal/dashboard"),
      ])
    : [null, null];

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI control"
        description="Server-to-server view of the FastAPI catalog, model config, and stored token usage."
      />
      <SupabaseConsoleCard />
      <AiOpsCard llm={overview?.llm} tokens={overview?.token_usage} />
      <GlassCard className="p-5">
        <p className="text-sm text-muted">
          {fastapi.reachable
            ? "Backend reachable."
            : "Backend is not reachable. Start FastAPI on port 8000."}
        </p>
        <ul className="mt-4 space-y-2 text-sm text-foreground">
          {(agents?.agents ?? []).length === 0 ? (
            <li className="text-muted">No agents returned (internal key or catalog empty).</li>
          ) : (
            agents?.agents?.map((agent, index) => (
              <li key={agent.slug ?? String(index)}>
                {agent.name ?? agent.slug ?? "Agent"}
              </li>
            ))
          )}
        </ul>
      </GlassCard>
    </div>
  );
}
