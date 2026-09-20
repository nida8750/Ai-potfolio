import { ProjectCard } from "@/components/projects/ProjectCard";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projects } from "@/data/projects";

export function Projects() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="relative pb-20 md:pb-28"
    >
      <Container>
        <SectionHeading
          eyebrow="Selected work"
          title="FEATURED AI PROJECTS"
          titleId="projects-heading"
          description="Concept systems that show how I structure agents, retrieval, voice, and automation. These are portfolio pieces, not claimed client engagements."
        />
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {projects.map((project) => (
            <li key={project.slug} id={project.slug}>
              <ProjectCard project={project} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
