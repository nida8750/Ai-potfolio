import { PageHeader } from "@/components/app/PageHeader";
import { RefundButton } from "@/components/admin/RefundButton";
import { Alert } from "@/components/ui/Alert";
import { DataTable } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";
import { configuredProviders } from "@/lib/payments";

export default async function AdminPaymentsPage() {
  await requireAdminOrRedirect("/admin/payments");
  const payments = await repository.listPayments();
  const providers = configuredProviders();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Records written from verified provider events. Refunds are only marked once the provider confirms them."
      />

      {providers.length === 0 ? (
        <Alert tone="warning">
          No payment provider is configured, so refunds cannot be issued from
          this console.
        </Alert>
      ) : null}

      {payments.length === 0 ? (
        <EmptyState
          title="No payments recorded"
          description="Payments appear here after a provider webhook is verified and applied."
        />
      ) : (
        <DataTable
          caption="Payments"
          headers={["Reference", "Order", "Provider", "Amount", "Status", "Recorded", ""]}
        >
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="px-4 py-3 text-foreground">{shortId(payment.id)}</td>
              <td className="px-4 py-3 text-muted">{shortId(payment.orderId)}</td>
              <td className="px-4 py-3 capitalize text-muted">{payment.provider}</td>
              <td className="whitespace-nowrap px-4 py-3 text-foreground">
                {formatMoney(payment.amount, payment.currency)}
              </td>
              <td className="px-4 py-3">
                <StatusBadge status={payment.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-muted">
                {formatDateTime(payment.createdAt)}
              </td>
              <td className="px-4 py-3 text-right">
                {payment.status === "paid" && providers.includes(payment.provider) ? (
                  <RefundButton paymentId={payment.id} />
                ) : (
                  <span className="text-xs text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
