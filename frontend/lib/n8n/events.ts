import "server-only";
import { dispatchToN8n } from "@/lib/n8n/client";
import { repository } from "@/lib/data/repository";
import { logEvent } from "@/lib/security/logger";
import type { Inquiry } from "@/types/inquiry";
import type { Order } from "@/types/order";
import type { PaymentRecord } from "@/types/payment";

async function notifyAdmins(
  type: Parameters<typeof repository.createNotification>[0]["type"],
  title: string,
  message: string,
): Promise<void> {
  const users = await repository.listUsers();
  const admins = users.filter((user) => user.role === "ADMIN" && user.status === "active");
  await Promise.all(
    admins.map((admin) =>
      repository.createNotification({ userId: admin.id, type, title, message }),
    ),
  );
  await dispatchToN8n("admin.alert", { type, title, message });
}

export async function onInquiryCreated(inquiry: Inquiry): Promise<void> {
  try {
    if (inquiry.userId) {
      await repository.createNotification({
        userId: inquiry.userId,
        type: "INQUIRY_RECEIVED",
        title: "Inquiry received",
        message: `We logged your inquiry (${inquiry.id}).`,
      });
    }
    await notifyAdmins(
      "ADMIN_ALERT",
      "New inquiry",
      `${inquiry.name} submitted an inquiry.`,
    );
  } catch (error) {
    logEvent({
      action: "notify.inquiry",
      result: "error",
      errorCategory: error instanceof Error ? error.name : "unknown",
    });
  }

  await dispatchToN8n("inquiry.created", {
    inquiryId: inquiry.id,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone,
    serviceId: inquiry.serviceId,
    message: inquiry.message,
    source: inquiry.source,
    createdAt: inquiry.createdAt,
  });
}

export async function onOrderCreated(order: Order): Promise<void> {
  await repository.createNotification({
    userId: order.userId,
    type: "ORDER_CREATED",
    title: "Order created",
    message: `Order ${order.id} is awaiting payment.`,
  });
  await notifyAdmins("ADMIN_ALERT", "New order", `Order ${order.id} was created.`);
  await dispatchToN8n("order.created", {
    orderId: order.id,
    userId: order.userId,
    serviceId: order.serviceId,
    amount: order.amount,
    currency: order.currency,
    customerEmail: order.customerEmail,
  });
}

export async function onPaymentSettled(
  order: Order,
  payment: PaymentRecord,
  succeeded: boolean,
): Promise<void> {
  await repository.createNotification({
    userId: order.userId,
    type: succeeded ? "PAYMENT_SUCCESS" : "PAYMENT_FAILED",
    title: succeeded ? "Payment received" : "Payment failed",
    message: succeeded
      ? `Payment for order ${order.id} was confirmed by ${payment.provider}.`
      : `Payment for order ${order.id} did not complete.`,
  });
  await notifyAdmins(
    "ADMIN_ALERT",
    succeeded ? "Payment received" : "Payment failed",
    `Order ${order.id} reported ${payment.status} via ${payment.provider}.`,
  );
  await dispatchToN8n(succeeded ? "payment.succeeded" : "payment.failed", {
    orderId: order.id,
    paymentId: payment.id,
    provider: payment.provider,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    customerEmail: order.customerEmail,
  });
}

export async function onPaymentRefunded(
  order: Order,
  payment: PaymentRecord,
): Promise<void> {
  await repository.createNotification({
    userId: order.userId,
    type: "ORDER_UPDATED",
    title: "Refund issued",
    message: `A refund was issued for order ${order.id}.`,
  });
  await dispatchToN8n("payment.refunded", {
    orderId: order.id,
    paymentId: payment.id,
    provider: payment.provider,
    amount: payment.amount,
    currency: payment.currency,
  });
}

export async function onInquiryStatusChanged(inquiry: Inquiry, previous: string): Promise<void> {
  if (inquiry.userId) {
    await repository.createNotification({
      userId: inquiry.userId,
      type: "INQUIRY_RECEIVED",
      title: "Inquiry updated",
      message: `Inquiry ${inquiry.id} moved from ${previous} to ${inquiry.status}.`,
    });
  }
  await dispatchToN8n("customer.notification", {
    inquiryId: inquiry.id,
    userId: inquiry.userId,
    previousStatus: previous,
    status: inquiry.status,
    email: inquiry.email,
  });
}

export async function onContentRequested(payload: Record<string, unknown>): Promise<void> {
  await dispatchToN8n("content.requested", payload);
}

export async function onOrderStatusChanged(order: Order, previous: string): Promise<void> {
  await repository.createNotification({
    userId: order.userId,
    type: "ORDER_UPDATED",
    title: "Order updated",
    message: `Order ${order.id} moved from ${previous} to ${order.orderStatus}.`,
  });
  await dispatchToN8n("order.status_changed", {
    orderId: order.id,
    userId: order.userId,
    previousStatus: previous,
    orderStatus: order.orderStatus,
    customerEmail: order.customerEmail,
  });
}
