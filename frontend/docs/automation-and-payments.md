# Automation and payments

Neither integration is connected in this environment. Both are implemented and
stay inert until their credentials exist.

## n8n

Set `N8N_WEBHOOK_BASE_URL` and `N8N_WEBHOOK_SECRET`.

The browser never calls n8n. A request goes to a Next.js route, the route
writes to the datastore, and only then is the event dispatched from the server.

Each dispatch is a `POST` to `<base>/<event-name>` with dots replaced by
hyphens, carrying:

| Header | Meaning |
| --- | --- |
| `x-nida-event` | Event name |
| `x-nida-timestamp` | Milliseconds since epoch |
| `x-nida-signature` | `HMAC-SHA256(secret, "<timestamp>.<body>")` as hex |

Verify both the signature and the timestamp freshness in the n8n workflow.

Events emitted: `inquiry.created`, `order.created`, `payment.succeeded`,
`payment.failed`, `payment.refunded`, `order.status_changed`.

Dispatch is best effort with a 4 second timeout. A failure is logged and the
call returns `failed` or `skipped`; it never rolls back the database write, so
an inquiry survives an n8n outage. The contact endpoint reports
`automationConfigured` truthfully, and the UI says nothing was emailed when it
is false.

## Payments

`lib/payments` defines one `PaymentProvider` interface with `createCheckout`,
`verifyWebhook`, `getPaymentStatus`, and `refundPayment`. Stripe and PayPal
each implement it. Nothing else in the application talks to a provider SDK
directly, and no provider is assumed to be available everywhere — set
`PAYMENT_PROVIDER` per deployment, or leave it `none` to keep checkout off.

### Amount integrity

The browser only sends a `serviceId`. The server loads the service, refuses
anything priced as a custom quote, and writes the amount and currency from the
stored record onto the order. Checkout then reads the amount from the order.
A submitted price is ignored.

### Stripe

Set `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and optionally
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.

Checkout Sessions are created with an idempotency key of `order-<orderId>`.
Webhook signatures are verified from the raw request body against the
`stripe-signature` header with a five minute tolerance, covered by unit tests.
Point the webhook at `/api/webhooks/stripe`.

### PayPal

Set `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`, and
`PAYPAL_ENVIRONMENT` (`sandbox` or `production`).

Orders are created server-side with `PayPal-Request-Id` for idempotency.
Webhooks are verified by calling PayPal's `verify-webhook-signature` endpoint,
which is why `PAYPAL_WEBHOOK_ID` is required. Point the webhook at
`/api/webhooks/paypal`.

### Settlement rules

A verified event is applied by `lib/payments/settle.ts`:

1. A previously seen event id is dropped as a duplicate.
2. An event with no matching order is recorded and ignored.
3. A paid event whose amount differs from the order is refused and the order
   is marked failed.
4. Otherwise a payment row is written, the order status follows the payment,
   the event id is recorded, and notifications and n8n dispatch run.

Returning to the success URL never marks an order paid. Only the verified
provider event does.

### Refunds

An admin can refund a settled payment when the provider is configured. The
record is only marked refunded after the provider confirms it; anything else
is stored as `processing`.
