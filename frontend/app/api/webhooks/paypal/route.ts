import { handleRoute } from "@/lib/api/route";
import { getProvider } from "@/lib/payments";
import { settlePaymentEvent } from "@/lib/payments/settle";
import { jsonError, jsonSuccess } from "@/lib/security/http";

export async function POST(request: Request) {
  return handleRoute(
    request,
    {
      action: "webhook.paypal",
      allowCrossOrigin: true,
      rateLimit: { limit: 120, windowMs: 60 * 1000 },
    },
    async ({ requestId }) => {
      const rawBody = await request.text();
      const event = await getProvider("paypal").verifyWebhook(rawBody, request.headers);

      if (!event) {
        return jsonError("IGNORED", "Event was not accepted.", 400);
      }

      const outcome = await settlePaymentEvent("paypal", event, requestId);
      return jsonSuccess({ received: true, outcome });
    },
  );
}
