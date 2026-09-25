import { z } from "zod";
import { handleRoute, parseBody } from "@/lib/api/route";
import { requireAuth } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { env } from "@/lib/env";
import { resolveProvider } from "@/lib/payments";
import { jsonError, jsonSuccess } from "@/lib/security/http";
import { idSchema } from "@/lib/validation/common";

const checkoutSchema = z.object({
  orderId: idSchema,
  provider: z.enum(["stripe", "paypal"]).optional(),
});

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "payments.checkout", rateLimit: { limit: 10, windowMs: 10 * 60 * 1000 } },
    async () => {
      const auth = await requireAuth();
      const input = await parseBody(request, checkoutSchema);

      const order = await repository.getOrder(input.orderId);
      if (!order || order.userId !== auth.id) {
        return jsonError("NOT_FOUND", "Order not found.", 404);
      }
      if (order.paymentStatus === "paid") {
        return jsonError("ALREADY_PAID", "This order is already paid.", 409);
      }

      const service = await repository.getService(order.serviceId);
      const provider = resolveProvider(input.provider);

      // The amount comes from the order created server-side from the stored
      // service price, so the browser never influences what is charged.
      const session = await provider.createCheckout({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        serviceTitle: service?.title ?? "Nida AI service",
        customerEmail: order.customerEmail,
        successUrl:
          auth.role === "ADMIN"
            ? `${env.appUrl}/dashboard/orders/${order.id}?checkout=complete`
            : `${env.appUrl}/?checkout=complete`,
        cancelUrl:
          auth.role === "ADMIN"
            ? `${env.appUrl}/dashboard/orders/${order.id}?checkout=cancelled`
            : `${env.appUrl}/?checkout=cancelled`,
      });

      await repository.updateOrder(order.id, {
        paymentProvider: session.provider,
        providerOrderId: session.providerOrderId,
        paymentStatus: "processing",
      });

      return jsonSuccess({
        provider: session.provider,
        redirectUrl: session.redirectUrl,
      });
    },
  );
}
