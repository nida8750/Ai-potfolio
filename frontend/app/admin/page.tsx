import Link from "next/link";
import { AiOpsCard } from "@/components/admin/AiOpsCard";
import { SupabaseConsoleCard } from "@/components/admin/SupabaseConsoleCard";
import { DashboardDetailPanel } from "@/components/app/DashboardDetailPanel";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { backendInternalGet, fetchBackendHealth } from "@/lib/api/backend-health";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { integrationRows } from "@/lib/integrations";
import { formatDate, formatMoney, shortId } from "@/lib/format";
import type { DashboardOverview } from "@/lib/api/backend-types";

type AdminDetail =
  | "services"
  | "projects"
  | "inquiries"
  | "users"
  | "orders"
  | "ai"
  | "tokens";

function asDetail(value: string | string[] | undefined): AdminDetail {
  const raw = Array.isArray(value) ? value[0] : value;
  if (
    raw === "services" ||
    raw === "projects" ||
    raw === "inquiries" ||
    raw === "users" ||
    raw === "orders" ||
    raw === "ai" ||
    raw === "tokens"
  ) {
    return raw;
  }
  return "inquiries";
}

function activityRows(items: unknown[]): Array<{
  id: string;
  status: string;
  when: string;
}> {
  return items.slice(0, 8).flatMap((item, index) => {
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

export default async function AdminOverviewPage({
  searchParams,
}: PageProps<"/admin">) {
  await requireAdminOrRedirect("/admin");
  const params = await searchParams;
  const detail = asDetail(params.detail);

  // Counted from stored records: an empty platform shows zeros.
  const overview = await repository.overview();
  const integrations = integrationRows();
  const [ai, fastapi] = await Promise.all([
    backendInternalGet<DashboardOverview>("/api/v1/internal/dashboard"),
    fetchBackendHealth(),
  ]);
  const recent = activityRows(ai?.recent_agent_activity ?? []);

  const [services, projects, inquiries, users, orders] = await Promise.all([
    detail === "services" ? repository.listServices() : Promise.resolve([]),
    detail === "projects" ? repository.listProjects() : Promise.resolve([]),
    detail === "inquiries" ? repository.listInquiries() : Promise.resolve([]),
    detail === "users" ? repository.listUsers() : Promise.resolve([]),
    detail === "orders" ? repository.listOrders() : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Overview"
        description="Click a count to open its records. Supabase, model, and token details stay on this page."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Services"
          value={overview.totalServices}
          hint={`${overview.activeServices} active`}
          href="/admin?detail=services#dashboard-details"
          selected={detail === "services"}
        />
        <StatCard
          label="Projects"
          value={overview.totalProjects}
          hint={`${overview.publishedProjects} published`}
          href="/admin?detail=projects#dashboard-details"
          selected={detail === "projects"}
        />
        <StatCard
          label="Inquiries"
          value={overview.inquiries}
          href="/admin?detail=inquiries#dashboard-details"
          selected={detail === "inquiries"}
        />
        <StatCard
          label="Users"
          value={overview.users}
          href="/admin?detail=users#dashboard-details"
          selected={detail === "users"}
        />
        <StatCard
          label="Pending orders"
          value={overview.pendingOrders}
          href="/admin?detail=orders#dashboard-details"
          selected={detail === "orders"}
        />
        <StatCard
          label="Paid orders"
          value={overview.paidOrders}
          href="/admin?detail=orders#dashboard-details"
          selected={detail === "orders"}
        />
        <StatCard
          label="AI agents"
          value={ai?.total_agents ?? 0}
          href="/admin?detail=ai#dashboard-details"
          selected={detail === "ai"}
        />
        <StatCard
          label="AI tasks"
          value={ai?.total_tasks ?? 0}
          href="/admin?detail=ai#dashboard-details"
          selected={detail === "ai"}
        />
        <StatCard
          label="Successful runs"
          value={ai?.successful_runs ?? 0}
          href="/admin?detail=ai#dashboard-details"
          selected={detail === "ai"}
        />
        <StatCard
          label="Failed runs"
          value={ai?.failed_runs ?? 0}
          href="/admin?detail=ai#dashboard-details"
          selected={detail === "ai"}
        />
        <StatCard
          label="Conversations"
          value={ai?.total_conversations ?? 0}
          href="/admin?detail=ai#dashboard-details"
          selected={detail === "ai"}
        />
        <StatCard
          label="Knowledge"
          value={ai?.total_knowledge_bases ?? 0}
          hint={`${ai?.total_documents ?? 0} documents`}
          href="/admin?detail=ai#dashboard-details"
          selected={detail === "ai"}
        />
      </div>

      {detail === "services" ? (
        <DashboardDetailPanel
          title="Services"
          description="Catalog entries stored for the public site."
          empty="No services stored yet."
          count={services.length}
          moreHref="/admin/services"
        >
          <ul className="space-y-2">
            {services.slice(0, 8).map((service) => (
              <li key={service.id}>
                <Link
                  href="/admin/services"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 hover:border-primary/40"
                >
                  <span className="text-sm text-foreground">{service.title}</span>
                  <span className="text-xs text-muted">
                    {service.isActive ? "Active" : "Inactive"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </DashboardDetailPanel>
      ) : null}

      {detail === "projects" ? (
        <DashboardDetailPanel
          title="Projects"
          description="Portfolio projects stored in this deployment."
          empty="No projects stored yet."
          count={projects.length}
          moreHref="/admin/projects"
        >
          <ul className="space-y-2">
            {projects.slice(0, 8).map((project) => (
              <li key={project.id}>
                <Link
                  href="/admin/projects"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 hover:border-primary/40"
                >
                  <span className="text-sm text-foreground">{project.title}</span>
                  <span className="text-xs text-muted">
                    {project.isPublished ? "Published" : "Draft"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </DashboardDetailPanel>
      ) : null}

      {detail === "inquiries" ? (
        <DashboardDetailPanel
          title="Inquiries"
          description="Contact and service requests, including the latest thank-you replies."
          empty="No inquiries stored yet."
          count={inquiries.length}
          moreHref="/admin/inquiries"
        >
          <ul className="space-y-2">
            {inquiries.slice(0, 8).map((inquiry) => (
              <li key={inquiry.id}>
                <Link
                  href="/admin/inquiries"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 hover:border-primary/40"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground">{inquiry.name}</span>
                    <span className="block text-xs text-muted">
                      {inquiry.subject ?? "Inquiry"} · {formatDate(inquiry.createdAt)}
                    </span>
                  </span>
                  <StatusBadge status={inquiry.status} />
                </Link>
              </li>
            ))}
          </ul>
        </DashboardDetailPanel>
      ) : null}

      {detail === "users" ? (
        <DashboardDetailPanel
          title="Users"
          description="Accounts stored for this platform."
          empty="No users stored yet."
          count={users.length}
          moreHref="/admin/users"
        >
          <ul className="space-y-2">
            {users.slice(0, 8).map((person) => (
              <li key={person.id}>
                <Link
                  href="/admin/users"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 hover:border-primary/40"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground">{person.name}</span>
                    <span className="block break-all text-xs text-muted">
                      {person.email}
                    </span>
                  </span>
                  <span className="text-xs text-muted">{person.role}</span>
                </Link>
              </li>
            ))}
          </ul>
        </DashboardDetailPanel>
      ) : null}

      {detail === "orders" ? (
        <DashboardDetailPanel
          title="Orders"
          description="Pending and paid orders from stored payment records."
          empty="No orders stored yet."
          count={orders.length}
          moreHref="/admin/orders"
        >
          <ul className="space-y-2">
            {orders.slice(0, 8).map((order) => (
              <li key={order.id}>
                <Link
                  href="/admin/orders"
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3 hover:border-primary/40"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground">
                      {shortId(order.id)} · {order.customerName}
                    </span>
                    <span className="block text-xs text-muted">
                      {formatMoney(order.amount, order.currency)} ·{" "}
                      {formatDate(order.createdAt)}
                    </span>
                  </span>
                  <StatusBadge status={order.paymentStatus} />
                </Link>
              </li>
            ))}
          </ul>
        </DashboardDetailPanel>
      ) : null}

      {detail === "ai" ? (
        <DashboardDetailPanel
          title="AI activity"
          description="Stored FastAPI agent runs. Empty means no runs have been recorded."
          empty="No agent runs recorded."
          count={recent.length}
          moreHref="/admin/ai"
        >
          <ul className="space-y-2 text-sm">
            {recent.map((row) => (
              <li key={row.id}>
                <Link
                  href="/admin/ai"
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-4 py-3 hover:border-primary/40"
                >
                  <span className="text-foreground">{row.status}</span>
                  <span className="text-muted">{row.when}</span>
                </Link>
              </li>
            ))}
          </ul>
        </DashboardDetailPanel>
      ) : null}

      {detail === "tokens" ? (
        <DashboardDetailPanel
          title="Token usage"
          description="Totals come from stored token_usage rows only. Nothing is estimated."
          empty="No token usage has been recorded yet."
          count={ai?.token_usage?.records_with_usage ?? 0}
          moreHref="/admin/ai"
        >
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 px-3 py-2">
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Prompt
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {ai?.token_usage?.prompt_tokens ?? 0}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 px-3 py-2">
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Completion
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {ai?.token_usage?.completion_tokens ?? 0}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 px-3 py-2">
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">Total</dt>
              <dd className="mt-1 text-sm text-foreground">
                {ai?.token_usage?.total_tokens ?? 0}
              </dd>
            </div>
            <div className="rounded-xl border border-white/10 px-3 py-2">
              <dt className="text-xs uppercase tracking-[0.14em] text-muted">
                Records
              </dt>
              <dd className="mt-1 text-sm text-foreground">
                {ai?.token_usage?.records_with_usage ?? 0}
              </dd>
            </div>
          </dl>
        </DashboardDetailPanel>
      ) : null}

      <SupabaseConsoleCard />
      <AiOpsCard
        llm={ai?.llm}
        tokens={ai?.token_usage}
        detailsHref="/admin?detail=tokens#dashboard-details"
      />

      <GlassCard className="p-5">
        <h2 className="font-display text-lg text-foreground">Integrations</h2>
        <p className="mt-1 text-sm text-muted">
          Each entry reflects the environment this deployment is actually
          running with. FastAPI health is live, not assumed.
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
