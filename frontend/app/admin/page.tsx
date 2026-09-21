import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import { activeDataStore, repository } from "@/lib/data/repository";
import { isCognitoConfigured, isN8nConfigured, isS3Configured } from "@/lib/env";
import { configuredProviders } from "@/lib/payments";

export default async function AdminOverviewPage() {
  await requireAdminOrRedirect("/admin");

  // Counted from stored records: an empty platform shows zeros.
  const overview = await repository.overview();
  const providers = configuredProviders();

  const integrations: Array<[string, string]> = [
    ["Data store", activeDataStore() === "dynamodb" ? "DynamoDB" : "Local file store"],
    ["Authentication", isCognitoConfigured() ? "AWS Cognito" : "Local development"],
    ["File storage", isS3Configured() ? "Amazon S3" : "Not configured"],
    ["Automation", isN8nConfigured() ? "n8n webhooks" : "Not configured"],
    ["Payments", providers.length ? providers.join(", ") : "Not configured"],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Live counts from the platform database and the integrations currently configured."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Services"
          value={overview.totalServices}
          hint={`${overview.activeServices} active`}
        />
        <StatCard
          label="Projects"
          value={overview.totalProjects}
          hint={`${overview.publishedProjects} published`}
        />
        <StatCard label="Inquiries" value={overview.inquiries} />
        <StatCard label="Users" value={overview.users} />
        <StatCard label="Pending orders" value={overview.pendingOrders} />
        <StatCard label="Paid orders" value={overview.paidOrders} />
      </div>

      <GlassCard className="p-5">
        <h2 className="font-display text-lg text-foreground">Integrations</h2>
        <p className="mt-1 text-sm text-muted">
          Each entry reflects the environment configuration this deployment is
          actually running with.
        </p>
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
        </dl>
      </GlassCard>
    </div>
  );
}
