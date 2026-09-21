import { handleRoute } from "@/lib/api/route";
import { getProvider } from "@/lib/payments";
import { settlePaymentEvent } from "@/lib/payments/settle";
import { jsonError, jsonSuccess } from "@/lib/security/http";

export async function POST(request: Request) {
  return handleRoute(
    request,
    {
      action: "webhook.stripe",
      allowCrossOrigin: true,
      rateLimit: { limit: 120, windowMs: 60 * 1000 },
    },
    async ({ requestId }) => {
      // The raw body is required: the signature covers the exact bytes sent.
      const rawBody = await request.text();
      const event = await getProvider("stripe").verifyWebhook(rawBody, request.headers);

      if (!event) {
        // Either the signature failed or the event type is not one we act on.
        // Both are answered without revealing which.
        return jsonError("IGNORED", "Event was not accepted.", 400);
      }

      const outcome = await settlePaymentEvent("stripe", event, requestId);
      return jsonSuccess({ received: true, outcome });
    },
  );
}
