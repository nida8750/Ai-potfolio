import { PageHeader } from "@/components/app/PageHeader";
import { ProjectManager } from "@/components/admin/ProjectManager";
import { requireAdminOrRedirect } from "@/lib/auth/guards";
import { repository } from "@/lib/data/repository";
import { isStorageConfigured } from "@/lib/env";

export default async function AdminProjectsPage() {
  await requireAdminOrRedirect("/admin/projects");
  const projects = await repository.listProjects();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Portfolio entries. Only published projects appear on the public site."
      />
      <ProjectManager initialProjects={projects} uploadsEnabled={isStorageConfigured()} />
    </div>
  );
}
