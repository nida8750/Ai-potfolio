import { ArrowUpRight, Github } from "lucide-react";

interface ProjectLinksProps {
  githubUrl?: string;
  liveUrl?: string;
  caseStudyHref?: string;
}

export function ProjectLinks({
  githubUrl,
  liveUrl,
  caseStudyHref = "#projects",
}: ProjectLinksProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      {githubUrl ? (
        <a
          href={githubUrl}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          <Github className="h-4 w-4" aria-hidden="true" />
          GitHub
        </a>
      ) : null}
      {liveUrl ? (
        <a
          href={liveUrl}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-ink"
        >
          Live Demo
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
        </a>
      ) : null}
      <a
        href={caseStudyHref}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-blue transition-colors hover:text-ink"
      >
        Case Study
        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
      </a>
    </div>
  );
}
