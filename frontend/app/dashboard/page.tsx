import Link from "next/link";
import { PageHeader } from "@/components/app/PageHeader";
import { StatCard } from "@/components/app/StatCard";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAuthOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { formatDate, formatMoney, shortId } from "@/lib/format";

export default async function DashboardPage({
  searchParams,
}: PageProps<"/dashboard">) {
  const user = await requireAuthOrRedirect("/dashboard");
  const params = await searchParams;

  const [orders, inquiries, notifications] = await Promise.all([
    repository.listOrders(user.id),
    repository.listInquiries(user.id),
    repository.listNotifications(user.id),
  ]);

  const unread = notifications.filter((item) => !item.read).length;
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Your requests, orders, and updates in one place."
        action={
          <Button href="/#services" size="sm" variant="secondary">
            Browse services
          </Button>
        }
      />

      {params.denied === "admin" ? (
        <Alert tone="error">
          That area is restricted to administrators.
        </Alert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Orders" value={orders.length} />
        <StatCard label="Inquiries" value={inquiries.length} />
        <StatCard label="Unread updates" value={unread} />
      </div>

      <section aria-labelledby="recent-orders">
        <h2 id="recent-orders" className="font-display text-lg text-foreground">
          Recent orders
        </h2>
        <div className="mt-3">
          {recentOrders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="Fixed-price services can be ordered from the services section. Services quoted individually start with an inquiry."
              action={
                <Button href="/#services" size="sm">
                  View services
                </Button>
              }
            />
          ) : (
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
          )}
        </div>
      </section>
    </div>
  );
}
