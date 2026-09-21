import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
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

/** Currencies Stripe treats as zero-decimal, so the amount is not multiplied. */
const ZERO_DECIMAL = new Set(["BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG", "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF"]);

const SIGNATURE_TOLERANCE_SECONDS = 300;

let client: Stripe | undefined;

function stripe(): Stripe {
  if (!env.stripeSecretKey) {
    throw new PaymentConfigurationError("Stripe");
  }
  client ??= new Stripe(env.stripeSecretKey);
  return client;
}

export function toMinorUnits(amount: number, currency: string): number {
  if (ZERO_DECIMAL.has(currency.toUpperCase())) {
    return Math.round(amount);
  }
  return Math.round(amount * 100);
}

export function fromMinorUnits(amount: number, currency: string): number {
  if (ZERO_DECIMAL.has(currency.toUpperCase())) {
    return amount;
  }
  return amount / 100;
}

/**
 * Stripe sends `t=<timestamp>,v1=<signature>`; the signed payload is
 * `<timestamp>.<raw body>`. Verifying manually keeps the check synchronous and
 * avoids depending on the SDK's runtime-specific crypto provider.
 */
export function verifyStripeSignature(
  rawBody: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!header) {
    return false;
  }

  const parts = Object.fromEntries(
    header.split(",").map((piece) => {
      const [key, value] = piece.split("=");
      return [key?.trim(), value?.trim()];
    }),
  ) as { t?: string; v1?: string };

  if (!parts.t || !parts.v1) {
    return false;
  }

  const timestamp = Number(parts.t);
  if (!Number.isFinite(timestamp)) {
    return false;
  }
  if (Math.abs(nowSeconds - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${parts.t}.${rawBody}`)
    .digest("hex");
  const left = Buffer.from(expected);
  const right = Buffer.from(parts.v1);
  return left.length === right.length && timingSafeEqual(left, right);
}

function statusFromEvent(type: string): PaymentStatus | undefined {
  switch (type) {
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded":
    case "payment_intent.succeeded":
      return "paid";
    case "checkout.session.async_payment_failed":
    case "payment_intent.payment_failed":
      return "failed";
    case "checkout.session.expired":
      return "cancelled";
    case "charge.refunded":
      return "refunded";
    default:
      return undefined;
  }
}

export const stripeProvider: PaymentProvider = {
  name: "stripe",

  isConfigured() {
    return Boolean(env.stripeSecretKey);
  },

  async createCheckout(request: CheckoutRequest): Promise<CheckoutSession> {
    const session = await stripe().checkout.sessions.create(
      {
        mode: "payment",
        customer_email: request.customerEmail,
        client_reference_id: request.orderId,
        success_url: request.successUrl,
        cancel_url: request.cancelUrl,
        metadata: { orderId: request.orderId },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: request.currency.toLowerCase(),
              unit_amount: toMinorUnits(request.amount, request.currency),
              product_data: { name: request.serviceTitle },
            },
          },
        ],
      },
      { idempotencyKey: `order-${request.orderId}` },
    );

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return {
      provider: "stripe",
      providerOrderId: session.id,
      redirectUrl: session.url,
    };
  },

  async verifyWebhook(rawBody: string, headers: Headers): Promise<VerifiedEvent | null> {
    if (!env.stripeWebhookSecret) {
      throw new PaymentConfigurationError("Stripe webhooks");
    }
    if (!verifyStripeSignature(rawBody, headers.get("stripe-signature"), env.stripeWebhookSecret)) {
      return null;
    }

    const event = JSON.parse(rawBody) as Stripe.Event;
    const status = statusFromEvent(event.type);
    if (!status) {
      return null;
    }

    const object = event.data.object as unknown as Record<string, unknown>;
    const currency = typeof object.currency === "string" ? object.currency.toUpperCase() : undefined;
    const rawAmount =
      typeof object.amount_total === "number"
        ? object.amount_total
        : typeof object.amount === "number"
          ? object.amount
          : undefined;

    return {
      eventId: event.id,
      type: event.type,
      providerOrderId: typeof object.id === "string" ? object.id : undefined,
      providerPaymentId:
        typeof object.payment_intent === "string" ? object.payment_intent : undefined,
      status,
      amount:
        rawAmount !== undefined && currency ? fromMinorUnits(rawAmount, currency) : undefined,
      currency,
    };
  },

  async getPaymentStatus(providerOrderId: string): Promise<PaymentStatus> {
    const session = await stripe().checkout.sessions.retrieve(providerOrderId);
    if (session.payment_status === "paid") {
      return "paid";
    }
    if (session.status === "expired") {
      return "cancelled";
    }
    return "pending";
  },

  async refundPayment(providerPaymentId: string, amount?: number): Promise<RefundResult> {
    const intent = await stripe().paymentIntents.retrieve(providerPaymentId);
    const refund = await stripe().refunds.create(
      {
        payment_intent: providerPaymentId,
        amount:
          amount === undefined ? undefined : toMinorUnits(amount, intent.currency.toUpperCase()),
      },
      { idempotencyKey: `refund-${providerPaymentId}` },
    );
    return {
      providerRefundId: refund.id,
      status: refund.status === "succeeded" ? "refunded" : "processing",
    };
  },
};
