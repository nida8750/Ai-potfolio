import { handleRoute } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { getProvider } from "@/lib/payments";
import { onPaymentRefunded } from "@/lib/n8n/events";
import { jsonError, jsonSuccess } from "@/lib/security/http";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(
    request,
    { action: "admin.payments.refund", rateLimit: { limit: 20, windowMs: 10 * 60 * 1000 } },
    async () => {
      const admin = await requireAdmin();
      const { id } = await params;

      const payment = await repository.getPayment(id);
      if (!payment) {
        return jsonError("NOT_FOUND", "Payment not found.", 404);
      }
      if (payment.status !== "paid") {
        return jsonError("NOT_REFUNDABLE", "Only settled payments can be refunded.", 409);
      }
      if (!payment.providerPaymentId) {
        return jsonError(
          "NOT_REFUNDABLE",
          "This payment has no provider reference to refund against.",
          409,
        );
      }

      const provider = getProvider(payment.provider);
      if (!provider.isConfigured()) {
        return jsonError(
          "PAYMENTS_UNAVAILABLE",
          `${payment.provider} is not configured, so refunds cannot be issued.`,
          503,
        );
      }

      // The record is only marked refunded after the provider confirms it.
      const result = await provider.refundPayment(payment.providerPaymentId, payment.amount);
      const updated = await repository.updatePayment(payment.id, { status: result.status });
      const order = await repository.getOrder(payment.orderId);

      if (order && result.status === "refunded") {
        await repository.updateOrder(order.id, { paymentStatus: "refunded" });
      }

      await repository.writeAudit({
        actorId: admin.id,
        action: "payment.refund",
        entityType: "PAYMENT",
        entityId: payment.id,
        metadata: { provider: payment.provider, status: result.status },
      });

      if (order && updated && result.status === "refunded") {
        await onPaymentRefunded(order, updated);
      }

      return jsonSuccess({ payment: updated, status: result.status });
    },
  );
}
