import "server-only";
import { env } from "@/lib/env";
import { PaymentConfigurationError } from "@/lib/payments/types";
import type {
  CheckoutRequest,
  CheckoutSession,
  PaymentProvider,
  RefundResult,
  VerifiedEvent,
} from "@/lib/payments/types";
import type { PaymentStatus } from "@/types/order";

function apiBase(): string {
  return env.paypalEnvironment === "production"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

function credentials(): { clientId: string; clientSecret: string } {
  if (!env.paypalClientId || !env.paypalClientSecret) {
    throw PaymentConfigurationError.forProvider("PayPal");
  }
  return { clientId: env.paypalClientId, clientSecret: env.paypalClientSecret };
}

let token: { value: string; expiresAt: number } | undefined;

async function accessToken(): Promise<string> {
  if (token && token.expiresAt > Date.now() + 30_000) {
    return token.value;
  }

  const { clientId, clientSecret } = credentials();
  const response = await fetch(`${apiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "content-type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`PayPal token request failed with status ${response.status}.`);
  }

  const body = (await response.json()) as { access_token: string; expires_in: number };
  token = {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };
  return token.value;
}

async function paypalFetch<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const { idempotencyKey, ...rest } = init;
  const response = await fetch(`${apiBase()}${path}`, {
    ...rest,
    headers: {
      authorization: `Bearer ${await accessToken()}`,
      "content-type": "application/json",
      ...(idempotencyKey ? { "PayPal-Request-Id": idempotencyKey } : {}),
      ...rest.headers,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`PayPal request to ${path} failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
}

function statusFromEvent(type: string): PaymentStatus | undefined {
  switch (type) {
    case "CHECKOUT.ORDER.APPROVED":
      return "processing";
    case "PAYMENT.CAPTURE.COMPLETED":
      return "paid";
    case "PAYMENT.CAPTURE.DENIED":
    case "PAYMENT.CAPTURE.REVERSED":
      return "failed";
    case "PAYMENT.CAPTURE.REFUNDED":
      return "refunded";
    case "CHECKOUT.ORDER.VOIDED":
      return "cancelled";
    default:
      return undefined;
  }
}

interface PayPalOrder {
  id: string;
  status: string;
  links?: Array<{ rel: string; href: string }>;
  purchase_units?: Array<{
    custom_id?: string;
    amount?: { value?: string; currency_code?: string };
    payments?: { captures?: Array<{ id: string; status: string }> };
  }>;
}

export const paypalProvider: PaymentProvider = {
  name: "paypal",

  isConfigured() {
    return Boolean(env.paypalClientId && env.paypalClientSecret);
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const order = await paypalFetch<PayPalOrder>("/v2/checkout/orders", {
      method: "POST",
      idempotencyKey: `order-${request.orderId}`,
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            custom_id: request.orderId,
            description: request.serviceTitle.slice(0, 127),
            amount: {
              currency_code: request.currency.toUpperCase(),
              value: request.amount.toFixed(2),
            },
          },
        ],
        payment_source: {
          paypal: {
            experience_context: {
              return_url: request.successUrl,
              cancel_url: request.cancelUrl,
              user_action: "PAY_NOW",
            },
          },
        },
      }),
    });

    const approve = order.links?.find((link) => link.rel === "payer-action" || link.rel === "approve");
    if (!approve) {
      throw new Error("PayPal did not return an approval link.");
    }

    return { provider: "paypal", providerOrderId: order.id, redirectUrl: approve.href };
  },

  /**
   * PayPal signatures are verified by calling its verification API rather than
   * by recomputing an HMAC locally, so this needs the webhook id and network.
   */
  async verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedEvent | null> {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID?.trim();
    if (!webhookId) {
      throw PaymentConfigurationError.forProvider("PayPal webhooks");
    }

    const verification = await paypalFetch<{ verification_status: string }>(
      "/v1/notifications/verify-webhook-signature",
      {
        method: "POST",
        body: JSON.stringify({
          auth_algo: headers.get("paypal-auth-algo"),
          cert_url: headers.get("paypal-cert-url"),
          transmission_id: headers.get("paypal-transmission-id"),
          transmission_sig: headers.get("paypal-transmission-sig"),
          transmission_time: headers.get("paypal-transmission-time"),
          webhook_id: webhookId,
          webhook_event: JSON.parse(rawBody),
        }),
      },
    );

    if (verification.verification_status !== "SUCCESS") {
      return null;
    }

    const event = JSON.parse(rawBody) as {
      id: string;
      event_type: string;
      resource?: {
        id?: string;
        supplementary_data?: { related_ids?: { order_id?: string } };
        amount?: { value?: string; currency_code?: string };
        custom_id?: string;
      };
    };

    const status = statusFromEvent(event.event_type);
    if (!status) {
      return null;
    }

    const amount = event.resource?.amount?.value;
    return {
      eventId: event.id,
      type: event.event_type,
      providerOrderId:
        event.resource?.supplementary_data?.related_ids?.order_id ?? event.resource?.id,
      providerPaymentId: event.resource?.id,
      status,
      amount: amount ? Number(amount) : undefined,
      currency: event.resource?.amount?.currency_code,
    };
  },

  async getPaymentStatus(providerOrderId: string): Promise<PaymentStatus> {
    const order = await paypalFetch<PayPalOrder>(`/v2/checkout/orders/${providerOrderId}`);
    switch (order.status) {
      case "COMPLETED":
        return "paid";
      case "APPROVED":
      case "SAVED":
        return "processing";
      case "VOIDED":
        return "cancelled";
      default:
        return "pending";
    }
  },

  async refundPayment(providerPaymentId: string, amount?: number): Promise<RefundResult> {
    const refund = await paypalFetch<{ id: string; status: string }>(
      `/v2/payments/captures/${providerPaymentId}/refund`,
      {
        method: "POST",
        idempotencyKey: `refund-${providerPaymentId}`,
        body: amount === undefined ? "{}" : JSON.stringify({ amount: { value: amount.toFixed(2) } }),
      },
    );
    return {
      providerRefundId: refund.id,
      status: refund.status === "COMPLETED" ? "refunded" : "processing",
    };
  },
};

/** Captures an approved PayPal order so funds actually move. */
export async function capturePayPalOrder(providerOrderId: string): Promise<{
  status: PaymentStatus;
  captureId?: string;
}> {
  const order = await paypalFetch<PayPalOrder>(
    `/v2/checkout/orders/${providerOrderId}/capture`,
    { method: "POST", idempotencyKey: `capture-${providerOrderId}`, body: "{}" },
  );
  const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
  return {
    status: order.status === "COMPLETED" ? "paid" : "processing",
    captureId: capture?.id,
  };
}
