import Link from "next/link";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/Button";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAuthOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { formatDate, formatMoney, shortId } from "@/lib/format";

export default async function DashboardOrdersPage() {
  const user = await requireAuthOrRedirect("/dashboard/orders");
  const orders = await repository.listOrders(user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Every order placed on your account, with its current payment and delivery state."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="When you order a fixed-price service it will appear here with its payment status."
          action={
            <Button href="/#services" size="sm">
              View services
            </Button>
          }
        />
      ) : (
        <DataTable
          caption="Your orders"
          headers={["Order", "Placed", "Amount", "Payment", "Status", ""]}
        >
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-medium text-foreground">
                {shortId(order.id)}
              </td>
              <td className="px-4 py-3 text-muted">{formatDate(order.createdAt)}</td>
              <td className="px-4 py-3 text-foreground">
                {formatMoney(order.amount, order.currency)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={order.paymentStatus} />
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={order.orderStatus} />
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="text-sm text-accent hover:text-foreground"
                >
                  View
                </Link>
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
