import { handleRoute, parseBody } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { ConflictError, updateService } from "@/lib/data/mutations";
import { repository } from "@/lib/data/repository";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { jsonError, jsonSuccess } from "@/lib/security/http";
import { serviceUpdateSchema } from "@/lib/validation/service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(request, { action: "admin.services.update" }, async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const current = await repository.getService(id);
    if (!current) {
      return jsonError("NOT_FOUND", "Service not found.", 404);
    }

    const patch = await parseBody(request, serviceUpdateSchema);

    try {
      const service = await updateService(current, patch);
      await repository.writeAudit({
        actorId: admin.id,
        action: "service.update",
        entityType: "SERVICE",
        entityId: service.id,
        metadata: { title: service.title, isActive: service.isActive },
      });
      revalidatePublicContent();
      return jsonSuccess({ service });
    } catch (error) {
      if (error instanceof ConflictError) {
        return jsonError("CONFLICT", error.message, 409);
      }
      throw error;
    }
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(request, { action: "admin.services.delete" }, async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const current = await repository.getService(id);
    if (!current) {
      return jsonError("NOT_FOUND", "Service not found.", 404);
    }

    const orders = await repository.listOrders();
    const hasOrders = orders.some((order) => order.serviceId === id);

    // Services with order history are deactivated instead of deleted so the
    // order records keep pointing at something real.
    if (hasOrders) {
      const service = await updateService(current, { isActive: false });
      await repository.writeAudit({
        actorId: admin.id,
        action: "service.deactivate",
        entityType: "SERVICE",
        entityId: id,
        metadata: { reason: "existing_orders" },
      });
      revalidatePublicContent();
      return jsonSuccess({ service, deleted: false, deactivated: true });
    }

    await repository.deleteService(id);
    await repository.writeAudit({
      actorId: admin.id,
      action: "service.delete",
      entityType: "SERVICE",
      entityId: id,
      metadata: { title: current.title },
    });
    revalidatePublicContent();
    return jsonSuccess({ deleted: true, deactivated: false });
  });
}
