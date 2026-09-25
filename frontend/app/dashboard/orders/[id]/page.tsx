import { notFound } from "next/navigation";
import { BackButton } from "@/components/app/BackButton";
import { CaptureOnReturn } from "@/components/app/CaptureOnReturn";
import { CheckoutButton } from "@/components/app/CheckoutButton";
import { PageHeader } from "@/components/app/PageHeader";
import { Alert } from "@/components/ui/Alert";
import { DataTable } from "@/components/ui/DataTable";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireAuthOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { formatDateTime, formatMoney, shortId } from "@/lib/format";
import { configuredProviders } from "@/lib/payments";

export default async function OrderDetailPage({
  params,
  searchParams,
}: PageProps<"/dashboard/orders/[id]">) {
  const user = await requireAuthOrRedirect("/dashboard/orders");
  const { id } = await params;
  const query = await searchParams;

  const order = await repository.getOrder(id);
  // A signed-in user may only open their own orders.
  if (!order || order.userId !== user.id) {
    notFound();
  }

  const service = await repository.getService(order.serviceId);
  const payments = (await repository.listPayments(user.id)).filter(
    (payment) => payment.orderId === order.id,
  );
  const providers = configuredProviders();

  const rows: Array<[string, string]> = [
    ["Service", service?.title ?? "Service no longer listed"],
    ["Amount", formatMoney(order.amount, order.currency)],
    ["Currency", order.currency],
    ["Payment provider", order.paymentProvider ?? "Not selected"],
    ["Created", formatDateTime(order.createdAt)],
    ["Updated", formatDateTime(order.updatedAt)],
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order ${shortId(order.id)}`}
        description="Payment state is set from the provider's verified confirmation, not from the browser."
      />

      <BackButton fallback="/dashboard/orders" label="Back to orders" />

      {query.checkout === "complete" &&
      order.paymentProvider === "paypal" &&
      order.paymentStatus !== "paid" ? (
        <CaptureOnReturn orderId={order.id} />
      ) : query.checkout === "complete" ? (
        <Alert tone="info">
          You returned from the payment provider. This order updates to paid once
          the provider&apos;s signed confirmation arrives.
        </Alert>
      ) : null}
      {query.checkout === "cancelled" ? (
        <Alert tone="warning">Checkout was cancelled. The order is unchanged.</Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <GlassCard className="p-5">
          <h2 className="font-display text-lg text-foreground">Details</h2>
          <dl className="mt-4 space-y-3">
            {rows.map(([label, value]) => (
              <div key={label} className="flex flex-wrap justify-between gap-2">
                <dt className="text-sm text-muted">{label}</dt>
                <dd className="text-sm text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="font-display text-lg text-foreground">Status</h2>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted">Payment</span>
              <StatusBadge status={order.paymentStatus} />
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-muted">Order</span>
              <StatusBadge status={order.orderStatus} />
            </div>
          </div>

          {order.paymentStatus === "paid" ? null : providers.length === 0 ? (
            <p className="mt-5 text-xs leading-5 text-muted">
              Online payment is not available yet because no payment provider is
              configured for this deployment.
            </p>
          ) : (
            <CheckoutButton orderId={order.id} providers={providers} />
          )}
        </GlassCard>
      </div>

      <section aria-labelledby="payment-history">
        <h2 id="payment-history" className="font-display text-lg text-foreground">
          Payment history
        </h2>
        <div className="mt-3">
          {payments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/12 px-4 py-6 text-center text-sm text-muted">
              No payment has been recorded for this order yet.
            </p>
          ) : (
            <DataTable
              caption="Payments recorded for this order"
              headers={["Reference", "Provider", "Amount", "Status", "Recorded"]}
            >
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <td className="px-4 py-3 text-foreground">{shortId(payment.id)}</td>
                  <td className="px-4 py-3 capitalize text-muted">{payment.provider}</td>
                  <td className="px-4 py-3 text-foreground">
                    {formatMoney(payment.amount, payment.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {formatDateTime(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </DataTable>
          )}
        </div>
        <p className="mt-3 text-xs text-muted">
          Only provider references are stored. Card numbers never reach this
          application.
        </p>
      </section>
    </div>
  );
}
