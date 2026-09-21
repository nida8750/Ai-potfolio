import { handleRoute, noStore, parseBody } from "@/lib/api/route";
import { requireAdmin } from "@/lib/auth/server";
import { ConflictError, createProject } from "@/lib/data/mutations";
import { repository } from "@/lib/data/repository";
import { revalidatePublicContent } from "@/lib/content/revalidate";
import { jsonError, jsonSuccess } from "@/lib/security/http";
import { projectInputSchema } from "@/lib/validation/project";

export async function GET(request: Request) {
  return handleRoute(request, { action: "admin.projects.list" }, async () => {
    await requireAdmin();
    const projects = await repository.listProjects();
    return noStore(jsonSuccess({ projects }));
  });
}

export async function POST(request: Request) {
  return handleRoute(request, { action: "admin.projects.create" }, async () => {
    const admin = await requireAdmin();
    const input = await parseBody(request, projectInputSchema);

    try {
      const project = await createProject(input);
      await repository.writeAudit({
        actorId: admin.id,
        action: "project.create",
        entityType: "PROJECT",
        entityId: project.id,
        metadata: { title: project.title, isPublished: project.isPublished },
      });
      revalidatePublicContent();
      return jsonSuccess({ project }, 201);
    } catch (error) {
      if (error instanceof ConflictError) {
        return jsonError("CONFLICT", error.message, 409);
      }
      throw error;
    }
  });
}
