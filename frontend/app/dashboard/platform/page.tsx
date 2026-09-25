import { AiOpsCard } from "@/components/admin/AiOpsCard";
import { SupabaseConsoleCard } from "@/components/admin/SupabaseConsoleCard";
import { PageHeader } from "@/components/app/PageHeader";
import { GlassCard } from "@/components/ui/GlassCard";
import { backendInternalGet, fetchBackendHealth } from "@/lib/api/backend-health";
import { requireAuthOrRedirect } from "@/lib/auth/guards";
import { integrationRows } from "@/lib/integrations";
import type { DashboardOverview } from "@/lib/api/backend-types";

export default async function DashboardPlatformPage() {
  await requireAuthOrRedirect("/dashboard/platform");
  const integrations = integrationRows();
  const [ai, fastapi] = await Promise.all([
    backendInternalGet<DashboardOverview>("/api/v1/internal/dashboard"),
    fetchBackendHealth(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supabase and platform"
        description="Direct links to your Supabase project, plus live model and token details."
      />
      <SupabaseConsoleCard />
      <AiOpsCard llm={ai?.llm} tokens={ai?.token_usage} />
      <GlassCard className="p-5">
        <h2 className="font-display text-lg text-foreground">Integrations</h2>
        <dl className="mt-4 space-y-3">
          {integrations.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-3 last:border-0 last:pb-0"
            >
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="text-sm text-foreground">{value}</dd>
            </div>
          ))}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <dt className="text-sm text-muted">FastAPI health</dt>
            <dd className="text-sm text-foreground">
              {fastapi.reachable
                ? `Reachable${fastapi.checks?.llm ? ` · LLM ${fastapi.checks.llm}` : ""}${fastapi.checks?.supabase ? ` · Supabase ${fastapi.checks.supabase}` : ""}`
                : "Not reachable"}
            </dd>
          </div>
        </dl>
      </GlassCard>
    </div>
  );
}
