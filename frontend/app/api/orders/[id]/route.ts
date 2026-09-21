import { handleRoute, noStore } from "@/lib/api/route";
import { requireAuth } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { jsonError, jsonSuccess } from "@/lib/security/http";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(request, { action: "orders.read" }, async () => {
    const auth = await requireAuth();
    const { id } = await params;
    const order = await repository.getOrder(id);

    // Object-level check: a valid session for another account still gets 404.
    if (!order || order.userId !== auth.id) {
      return jsonError("NOT_FOUND", "Order not found.", 404);
    }

    const service = await repository.getService(order.serviceId);
    const payments = (await repository.listPayments(auth.id)).filter(
      (payment) => payment.orderId === order.id,
    );

    return noStore(
      jsonSuccess({
        order,
        serviceTitle: service?.title ?? "Service",
        payments: payments.map((payment) => ({
          id: payment.id,
          provider: payment.provider,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          createdAt: payment.createdAt,
        })),
      }),
    );
  });
}
