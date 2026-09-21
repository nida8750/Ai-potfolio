import "server-only";
import { repository } from "@/lib/data/repository";
import { onPaymentRefunded, onPaymentSettled } from "@/lib/n8n/events";
import { logEvent } from "@/lib/security/logger";
import type { VerifiedEvent } from "@/lib/payments/types";
import type { PaymentProviderName, PaymentStatus } from "@/types/order";

export type SettlementOutcome =
  | "processed"
  | "duplicate"
  | "order_not_found"
  | "amount_mismatch"
  | "ignored";

const ORDER_STATUS_FOR_PAYMENT: Partial<Record<PaymentStatus, "confirmed" | "cancelled">> = {
  paid: "confirmed",
  cancelled: "cancelled",
};

function amountsMatch(expected: number, actual: number): boolean {
  return Math.abs(expected - actual) < 0.01;
}

/**
 * Applies a provider event that has already had its signature verified. The
 * order amount recorded at checkout is the source of truth: a mismatched
 * amount is refused rather than silently marking the order paid.
 */
export async function settlePaymentEvent(
  provider: PaymentProviderName,
  event: VerifiedEvent,
  requestId: string,
): Promise<SettlementOutcome> {
  if (await repository.hasProcessedEvent(provider, event.eventId)) {
    logEvent({
      requestId,
      action: "payment.settle",
      result: "ok",
      metadata: { provider, outcome: "duplicate" },
    });
    return "duplicate";
  }

  const order = event.providerOrderId
    ? await repository.getOrderByProviderOrderId(provider, event.providerOrderId)
    : undefined;

  // A capture performed on return and the webhook that follows it arrive with
  // different event ids, so an already paid order is the second signal for the
  // same money and must not be recorded twice.
  if (order && order.paymentStatus === "paid" && event.status === "paid") {
    await repository.recordProcessedEvent(provider, event.eventId);
    logEvent({
      requestId,
      action: "payment.settle",
      result: "ok",
      metadata: { provider, orderId: order.id, outcome: "already_paid" },
    });
    return "duplicate";
  }

  if (!order) {
    await repository.recordProcessedEvent(provider, event.eventId);
    logEvent({
      requestId,
      action: "payment.settle",
      result: "error",
      errorCategory: "order_not_found",
      metadata: { provider },
    });
    return "order_not_found";
  }

  if (
    event.status === "paid" &&
    event.amount !== undefined &&
    !amountsMatch(order.amount, event.amount)
  ) {
    await repository.recordProcessedEvent(provider, event.eventId);
    await repository.updateOrder(order.id, { paymentStatus: "failed" });
    logEvent({
      requestId,
      action: "payment.settle",
      result: "error",
      errorCategory: "amount_mismatch",
      metadata: { provider, orderId: order.id },
    });
    return "amount_mismatch";
  }

  const payment = await repository.createPayment({
    orderId: order.id,
    userId: order.userId,
    provider,
    providerPaymentId: event.providerPaymentId,
    providerOrderId: event.providerOrderId,
    amount: order.amount,
    currency: order.currency,
    status: event.status,
    eventId: event.eventId,
  });

  const nextOrderStatus = ORDER_STATUS_FOR_PAYMENT[event.status];
  const updatedOrder =
    (await repository.updateOrder(order.id, {
      paymentStatus: event.status,
      providerPaymentId: event.providerPaymentId ?? order.providerPaymentId,
      ...(nextOrderStatus ? { orderStatus: nextOrderStatus } : {}),
    })) ?? order;

  await repository.recordProcessedEvent(provider, event.eventId);

  if (event.status === "refunded") {
    await onPaymentRefunded(updatedOrder, payment);
  } else if (event.status === "paid" || event.status === "failed") {
    await onPaymentSettled(updatedOrder, payment, event.status === "paid");
  }

  logEvent({
    requestId,
    action: "payment.settle",
    result: "ok",
    userId: order.userId,
    metadata: { provider, orderId: order.id, status: event.status },
  });

  return "processed";
}
