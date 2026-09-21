import { handleRoute, noStore, parseBody } from "@/lib/api/route";
import { requireAuth } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { onOrderCreated } from "@/lib/n8n/events";
import { paymentsEnabled } from "@/lib/payments";
import { jsonError, jsonSuccess } from "@/lib/security/http";
import { createOrderSchema } from "@/lib/validation/payment";

export async function GET(request: Request) {
  return handleRoute(request, { action: "orders.list" }, async () => {
    const auth = await requireAuth();
    // Identity comes from the session, never from a query parameter.
    const orders = await repository.listOrders(auth.id);
    return noStore(jsonSuccess({ orders }));
  });
}

export async function POST(request: Request) {
  return handleRoute(
    request,
    { action: "orders.create", rateLimit: { limit: 10, windowMs: 10 * 60 * 1000 } },
    async () => {
      const auth = await requireAuth();
      const input = await parseBody(request, createOrderSchema);

      const service = await repository.getService(input.serviceId);
      if (!service || !service.isActive) {
        return jsonError("SERVICE_NOT_FOUND", "That service is not available.", 404);
      }

      if (service.pricingType === "custom" || !service.price || service.price <= 0) {
        return jsonError(
          "QUOTE_REQUIRED",
          "This service is quoted individually. Send an inquiry instead of paying up front.",
          409,
        );
      }

      const profile = await repository.getUser(auth.id);
      if (!profile) {
        return jsonError("NOT_FOUND", "Profile not found.", 404);
      }

      // Amount and currency are read from the stored service, so a client
      // cannot submit its own price.
      const order = await repository.createOrder({
        userId: auth.id,
        serviceId: service.id,
        customerEmail: profile.email,
        customerName: profile.name,
        amount: service.price,
        currency: service.currency,
        paymentStatus: "pending",
        orderStatus: "pending",
      });

      await onOrderCreated(order);

      return jsonSuccess({ order, paymentsEnabled: paymentsEnabled() }, 201);
    },
  );
}
