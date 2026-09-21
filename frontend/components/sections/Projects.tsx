import { FolderKanban } from "lucide-react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { ServicesIntro } from "@/components/services/ServiceCard";
import { Container } from "@/components/ui/Container";
import { EmptyState } from "@/components/ui/EmptyState";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { loadPublicProjects } from "@/lib/content/public-content";

export async function Projects() {
  const { items: projects } = await loadPublicProjects();

  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="relative overflow-hidden py-14 md:py-20 lg:py-24"
    >
      <GlowOrb
        color="purple"
        className="pointer-events-none -left-24 top-24 h-56 w-56 opacity-40"
      />
      <Container className="relative">
        <ServicesIntro>
          <SectionHeading
            icon={<FolderKanban className="h-5 w-5" />}
            title="Featured Projects"
            titleId="projects-heading"
            description="Real-world AI solutions with a modern tech stack. These are portfolio concepts, not claimed client engagements."
          />
        </ServicesIntro>

        {projects.length === 0 ? (
          <div className="mt-10">
            <EmptyState
              title="No projects published yet"
              description="Projects appear here once they are published in the admin console."
            />
          </div>
        ) : (
          <ul className="mt-9 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, index) => (
              <li key={project.id} className="min-w-0">
                <ProjectCard project={project} index={index} />
              </li>
            ))}
          </ul>
        )}
      </Container>
    </section>
  );
}
