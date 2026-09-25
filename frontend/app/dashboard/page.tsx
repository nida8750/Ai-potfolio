import Link from "next/link";
import { AiOpsCard } from "@/components/admin/AiOpsCard";
import { SupabaseConsoleCard } from "@/components/admin/SupabaseConsoleCard";
import { DashboardDetailPanel } from "@/components/app/DashboardDetailPanel";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { backendInternalGet } from "@/lib/api/backend-health";
import { requireAuthOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { formatDate, formatDateTime, formatMoney, shortId } from "@/lib/format";
import type { DashboardOverview } from "@/lib/api/backend-types";

type DashboardDetail = "orders" | "inquiries" | "notifications";

function asDetail(
  value: string | string[] | undefined,
  fallback: DashboardDetail,
): DashboardDetail {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === "inquiries" || raw === "notifications" || raw === "orders") {
    return raw;
  }
  return fallback;
}

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const user = await requireAuthOrRedirect("/dashboard");
  const params = await searchParams;

  const [orders, inquiries, notifications, ai] = await Promise.all([
    repository.listOrders(user.id),
    repository.listInquiries(user.id),
    repository.listNotifications(user.id),
    backendInternalGet<DashboardOverview>("/api/v1/internal/dashboard"),
  ]);

  const unread = notifications.filter((item) => !item.read).length;
  const detail = asDetail(
    params.detail,
    orders.length > 0 ? "orders" : inquiries.length > 0 ? "inquiries" : "notifications",
  );
  const recentOrders = orders.slice(0, 8);
  const recentInquiries = inquiries.slice(0, 8);
  const recentNotes = notifications.slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Click a count to open its details. Your requests, orders, and updates stay on this page."
        action={
          <Button href="/#services" size="sm" variant="secondary">
            Browse services
          </Button>
        }
      />

      {params.denied === "admin" ? (
        <Alert tone="error">That area is restricted to administrators.</Alert>
      ) : null}

      <SupabaseConsoleCard />
      <AiOpsCard llm={ai?.llm} tokens={ai?.token_usage} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Orders"
          value={orders.length}
          href="/dashboard?detail=orders#dashboard-details"
          selected={detail === "orders"}
        />
        <StatCard
          label="Inquiries"
          value={inquiries.length}
          href="/dashboard?detail=inquiries#dashboard-details"
          selected={detail === "inquiries"}
        />
        <StatCard
          label="Unread updates"
          value={unread}
          hint={`${notifications.length} total`}
          href="/dashboard?detail=notifications#dashboard-details"
          selected={detail === "notifications"}
        />
      </div>

      {detail === "orders" ? (
        <DashboardDetailPanel
          title="Orders"
          description="Payment and delivery state for services you ordered."
          empty="No orders yet. Fixed-price services can be ordered from the services section."
          count={recentOrders.length}
          moreHref="/dashboard/orders"
        >
          <ul className="space-y-2">
            {recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface/60 px-4 py-3 hover:border-primary/40"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground">
                      Order {shortId(order.id)}
                    </span>
                    <span className="block text-xs text-muted">
                      {formatDate(order.createdAt)} ·{" "}
                      {formatMoney(order.amount, order.currency)}
                    </span>
                  </span>
                  <StatusBadge status={order.paymentStatus} />
                </Link>
              </li>
            ))}
          </ul>
        </DashboardDetailPanel>
      ) : null}

      {detail === "inquiries" ? (
        <DashboardDetailPanel
          title="Inquiries"
          description="Messages you sent about a service or a general request."
          empty="No inquiries yet. Send one from the contact section while signed in."
          count={recentInquiries.length}
          moreHref="/dashboard/inquiries"
        >
          <ul className="space-y-2">
            {recentInquiries.map((inquiry) => (
              <li key={inquiry.id}>
                <Link
                  href={`/dashboard/inquiries/${inquiry.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-surface/60 px-4 py-3 hover:border-primary/40"
                >
                  <span className="min-w-0">
                    <span className="block text-sm text-foreground">
                      {inquiry.subject ?? "Inquiry"}
                    </span>
                    <span className="block text-xs text-muted">
                      {shortId(inquiry.id)} · {formatDate(inquiry.createdAt)}
                    </span>
                  </span>
                  <StatusBadge status={inquiry.status} />
                </Link>
              </li>
            ))}
          </ul>
        </DashboardDetailPanel>
      ) : null}

      {detail === "notifications" ? (
        <DashboardDetailPanel
          title="Updates"
          description="Platform notes about your inquiries, orders, and payments."
          empty="No updates yet."
          count={recentNotes.length}
          moreHref="/dashboard/notifications"
        >
          <ul className="space-y-2">
            {recentNotes.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-white/10 bg-surface/60 px-4 py-3"
              >
                <p className="text-sm text-foreground">{item.title}</p>
                <p className="mt-1 text-xs text-muted">{item.message}</p>
                <p className="mt-2 text-xs text-muted">
                  {formatDateTime(item.createdAt)}
                  {item.read ? "" : " · Unread"}
                </p>
              </li>
            ))}
          </ul>
        </DashboardDetailPanel>
      ) : null}

      {orders.length === 0 && inquiries.length === 0 ? (
        <EmptyState
          title="Nothing to open yet"
          description="Place an order or send an inquiry, then click a card above to see its details."
          action={
            <Button href="/#contact" size="sm">
              Send an inquiry
            </Button>
          }
        />
      ) : null}
    </div>
  );
}
