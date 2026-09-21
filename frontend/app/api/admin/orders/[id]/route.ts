import { handleRoute, parseBody } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { canTransitionOrder, repository } from "@/lib/data/repository";
import { onOrderStatusChanged } from "@/lib/n8n/events";
import { jsonError, jsonSuccess } from "@/lib/security/http";
import { orderStatusSchema } from "@/lib/validation/payment";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(request, { action: "admin.orders.update" }, async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const patch = await parseBody(request, orderStatusSchema);

    const current = await repository.getOrder(id);
    if (!current) {
      return jsonError("NOT_FOUND", "Order not found.", 404);
    }

    // Only the transitions defined for the current state are accepted.
    if (!canTransitionOrder(current.orderStatus, patch.orderStatus)) {
      return jsonError(
        "INVALID_TRANSITION",
        `An order cannot move from ${current.orderStatus} to ${patch.orderStatus}.`,
        409,
      );
    }

    const order = await repository.updateOrder(id, { orderStatus: patch.orderStatus });
    if (!order) {
      return jsonError("NOT_FOUND", "Order not found.", 404);
    }

    await repository.writeAudit({
      actorId: admin.id,
      action: "order.status_change",
      entityType: "ORDER",
      entityId: id,
      metadata: { from: current.orderStatus, to: order.orderStatus },
    });
    await onOrderStatusChanged(order, current.orderStatus);

    return jsonSuccess({ order });
  });
}
