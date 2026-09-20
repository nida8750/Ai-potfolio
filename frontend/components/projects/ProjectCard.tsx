import type { Project } from "@/types/project";
import { GlowCard } from "@/components/ui/GlowCard";
import { ProjectLinks } from "@/components/projects/ProjectLinks";
import { ProjectTags } from "@/components/projects/ProjectTags";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const headingId = `${project.slug}-title`;

  return (
    <GlowCard className="overflow-hidden p-0">
      <article aria-labelledby={headingId}>
        <div className="relative aspect-[16/10] overflow-hidden bg-secondary">
          {project.image ? (
            // SVG placeholders stay local; next/image is reserved for raster assets later.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.image}
              alt={`${project.title} concept preview`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              Preview coming soon
            </div>
          )}
        </div>
        <div className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-purple">
            {project.category}
          </p>
          <h3 id={headingId} className="mt-2 font-display text-xl text-ink">
            {project.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-muted">
            {project.description}
          </p>
          <div className="mt-4">
            <ProjectTags technologies={project.technologies} />
          </div>
          <ProjectLinks
            githubUrl={project.githubUrl}
            liveUrl={project.liveUrl}
            caseStudyHref={`#${project.slug}`}
          />
        </div>
      </article>
    </GlowCard>
  );
}
