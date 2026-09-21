import { z } from "zod";
import { handleRoute, parseBody } from "@/lib/api/route";
import { requireAuth } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { capturePayPalOrder } from "@/lib/payments/paypal";
import { settlePaymentEvent } from "@/lib/payments/settle";
import { jsonError, jsonSuccess } from "@/lib/security/http";
import { idSchema } from "@/lib/validation/common";

const captureSchema = z.object({ orderId: idSchema });

/**
 * PayPal orders are approved by the payer and then captured by the merchant.
 * The buyer's return triggers this capture; the webhook that follows is
 * deduplicated by the settlement rules, so whichever arrives first wins.
 */
export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "payments.capture", rateLimit: { limit: 10, windowMs: 10 * 60 * 1000 } },
    async ({ requestId }) => {
      const auth = await requireAuth();
      const input = await parseBody(request, captureSchema);

      const order = await repository.getOrder(input.orderId);
      if (!order || order.userId !== auth.id) {
        return jsonError("NOT_FOUND", "Order not found.", 404);
      }
      if (order.paymentProvider !== "paypal" || !order.providerOrderId) {
        return jsonError("NOT_CAPTURABLE", "This order has no PayPal checkout to capture.", 409);
      }
      if (order.paymentStatus === "paid") {
        return jsonSuccess({ status: "paid", alreadySettled: true });
      }

      const result = await capturePayPalOrder(order.providerOrderId);

      if (result.status === "paid") {
        await settlePaymentEvent(
          "paypal",
          {
            eventId: `capture:${order.providerOrderId}`,
            type: "capture.completed",
            providerOrderId: order.providerOrderId,
            providerPaymentId: result.captureId,
            status: "paid",
            amount: order.amount,
            currency: order.currency,
          },
          requestId,
        );
      }

      return jsonSuccess({ status: result.status, alreadySettled: false });
    },
  );
}
