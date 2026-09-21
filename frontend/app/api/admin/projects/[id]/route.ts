import { handleRoute, parseBody } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { ConflictError, updateProject } from "@/lib/data/mutations";
import { repository } from "@/lib/data/repository";
import { jsonError, jsonSuccess } from "@/lib/security/http";
import { projectUpdateSchema } from "@/lib/validation/project";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return handleRoute(request, { action: "admin.projects.update" }, async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const current = await repository.getProject(id);
    if (!current) {
      return jsonError("NOT_FOUND", "Project not found.", 404);
    }

    const patch = await parseBody(request, projectUpdateSchema);

    try {
      const project = await updateProject(current, patch);
      await repository.writeAudit({
        actorId: admin.id,
        action: patch.isPublished === undefined ? "project.update" : "project.publish",
        entityType: "PROJECT",
        entityId: project.id,
        metadata: { title: project.title, isPublished: project.isPublished },
      });
      return jsonSuccess({ project });
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
  return handleRoute(request, { action: "admin.projects.delete" }, async () => {
    const admin = await requireAdmin();
    const { id } = await params;
    const removed = await repository.deleteProject(id);
    if (!removed) {
      return jsonError("NOT_FOUND", "Project not found.", 404);
    }

    await repository.writeAudit({
      actorId: admin.id,
      action: "project.delete",
      entityType: "PROJECT",
      entityId: id,
    });
    return jsonSuccess({ deleted: true });
  });
}
