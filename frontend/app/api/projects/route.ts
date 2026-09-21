import { handleRoute, noStore } from "@/lib/api/route";
import { repository } from "@/lib/data/repository";
import { toPublicProject } from "@/lib/data/presenters";
import { jsonSuccess } from "@/lib/security/http";

export async function GET(request: Request) {
  return handleRoute(request, { action: "projects.list" }, async () => {
    const projects = await repository.listProjects({ publishedOnly: true });
    return noStore(jsonSuccess({ projects: projects.map(toPublicProject) }));
  });
}
