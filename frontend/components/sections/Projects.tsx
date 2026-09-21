import { ProjectCard } from "@/components/projects/ProjectCard";
import { ServicesIntro } from "@/components/services/ServiceCard";
import { Container } from "@/components/ui/Container";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projects } from "@/data/projects";

export function Projects() {
  return (
    <section
      id="projects"
      aria-labelledby="projects-heading"
      className="relative overflow-hidden py-16 md:py-24 lg:py-28"
    >
      <GlowOrb
        color="purple"
        className="pointer-events-none -left-24 top-24 h-56 w-56 opacity-40"
      />
      <Container className="relative">
        <ServicesIntro>
          <SectionHeading
            eyebrow="SELECTED WORK"
            title="FEATURED AI PROJECTS"
            titleId="projects-heading"
            description="Concept systems that show how I structure agents, retrieval, voice, and automation. These are portfolio pieces, not claimed client engagements."
          />
        </ServicesIntro>
        <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2">
          {projects.map((project, index) => (
            <li key={project.slug} className="min-w-0">
              <ProjectCard project={project} index={index} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
