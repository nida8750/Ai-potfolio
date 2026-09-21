import { handleRoute, noStore, parseBody } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { ConflictError, createService } from "@/lib/data/mutations";
import { repository } from "@/lib/data/repository";
import { jsonError, jsonSuccess } from "@/lib/security/http";
import { serviceInputSchema } from "@/lib/validation/service";

export async function GET(request: Request) {
  return handleRoute(request, { action: "admin.services.list" }, async () => {
    await requireAdmin();
    const services = await repository.listServices();
    return noStore(jsonSuccess({ services }));
  });
}

export async function POST(request: Request) {
  return handleRoute(request, { action: "admin.services.create" }, async () => {
    const admin = await requireAdmin();
    const input = await parseBody(request, serviceInputSchema);

    try {
      const service = await createService(input);
      await repository.writeAudit({
        actorId: admin.id,
        action: "service.create",
        entityType: "SERVICE",
        entityId: service.id,
        metadata: { title: service.title, pricingType: service.pricingType },
      });
      return jsonSuccess({ service }, 201);
    } catch (error) {
      if (error instanceof ConflictError) {
        return jsonError("CONFLICT", error.message, 409);
      }
      throw error;
    }
  });
}
