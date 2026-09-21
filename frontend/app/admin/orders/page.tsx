import { PageHeader } from "@/components/app/PageHeader";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import { allowedOrderTransitions, repository } from "@/lib/data/repository";
import { formatDate, formatMoney, shortId } from "@/lib/format";
import type { OrderStatus } from "@/types/order";

const labels: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function AdminOrdersPage() {
  await requireAdminOrRedirect("/admin/orders");
  const orders = await repository.listOrders();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Payment state is written by verified provider events. Only valid status transitions are offered."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          description="Orders placed against fixed-price services will appear here."
        />
      ) : (
        <DataTable
          caption="Orders"
          headers={["Order", "Customer", "Amount", "Payment", "Placed", "Status"]}
        >
          {orders.map((order) => {
            const options = [
              { value: order.orderStatus, label: labels[order.orderStatus] },
              ...allowedOrderTransitions[order.orderStatus].map((status) => ({
                value: status,
                label: labels[status],
              })),
            ];

            return (
              <tr key={order.id}>
                <td className="px-4 py-3 align-top font-medium text-foreground">
                  {shortId(order.id)}
                </td>
                <td className="px-4 py-3 align-top">
                  <span className="block text-foreground">{order.customerName}</span>
                  <span className="block break-all text-xs text-muted">
                    {order.customerEmail}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-foreground">
                  {formatMoney(order.amount, order.currency)}
                </td>
                <td className="px-4 py-3 align-top">
                  <StatusBadge status={order.paymentStatus} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 align-top text-muted">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-4 py-3 align-top">
                  {options.length === 1 ? (
                    <StatusBadge status={order.orderStatus} />
                  ) : (
                    <StatusSelect
                      endpoint={`/api/admin/orders/${order.id}`}
                      field="orderStatus"
                      value={order.orderStatus}
                      options={options}
                      label={`Status for order ${shortId(order.id)}`}
                    />
                  )}
                </td>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
