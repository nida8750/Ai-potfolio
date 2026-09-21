import { z } from "zod";
import { handleRoute, parseBody } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { repository } from "@/lib/data/repository";
import { jsonError, jsonSuccess } from "@/lib/security/http";

const userPatchSchema = z.object({
  role: z.enum(["USER", "ADMIN"]).optional(),
  status: z.enum(["active", "disabled"]).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(request, { action: "admin.users.update" }, async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const patch = await parseBody(request, userPatchSchema);

    if (patch.role === undefined && patch.status === undefined) {
      return jsonError("VALIDATION_ERROR", "Provide a role or status to change.", 422);
    }

    const target = await repository.getUser(id);
    if (!target) {
      return jsonError("NOT_FOUND", "User not found.", 404);
    }

    // An admin cannot demote or disable their own account and lock the
    // platform out of its last administrator.
    if (target.id === admin.id && (patch.role === "USER" || patch.status === "disabled")) {
      return jsonError("FORBIDDEN", "You cannot remove your own admin access.", 403);
    }

    if (target.role === "ADMIN" && (patch.role === "USER" || patch.status === "disabled")) {
      const admins = (await repository.listUsers()).filter(
        (user) => user.role === "ADMIN" && user.status === "active",
      );
      if (admins.length <= 1) {
        return jsonError("FORBIDDEN", "At least one active admin must remain.", 403);
      }
    }

    const user = await repository.updateUser(id, patch);
    if (!user) {
      return jsonError("NOT_FOUND", "User not found.", 404);
    }

    await repository.writeAudit({
      actorId: admin.id,
      action: patch.role ? "user.role_change" : "user.status_change",
      entityType: "USER",
      entityId: id,
      metadata: { role: user.role, status: user.status },
    });

    return jsonSuccess({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  });
}
