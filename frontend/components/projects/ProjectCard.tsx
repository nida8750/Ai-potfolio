"use client";

import { motion, useReducedMotion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProjectLinks } from "@/components/projects/ProjectLinks";
import { ProjectTags } from "@/components/projects/ProjectTags";
import { fadeUp } from "@/lib/animations";
import type { PublicProject } from "@/lib/data/presenters";

interface ProjectCardProps {
  project: PublicProject;
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const reduceMotion = useReducedMotion();
  const headingId = `${project.slug}-title`;

  return (
    <motion.article
      aria-labelledby={headingId}
      variants={fadeUp}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }
      }
      className="h-full min-w-0"
    >
      <GlassCard hover className="flex h-full flex-col overflow-hidden p-0">
        <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-surface-secondary">
          {project.image ? (
            // Local SVG concept art; next/image is reserved for raster assets.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.image}
              alt={`${project.title} concept diagram`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full bg-[radial-gradient(circle_at_30%_20%,rgb(139_92_246_/_0.2),transparent_55%),radial-gradient(circle_at_80%_80%,rgb(56_189_248_/_0.12),transparent_50%)]" />
          )}

          <span className="absolute bottom-3 left-3 inline-flex items-center rounded-full border border-primary/40 bg-background/85 px-2.5 py-1 text-[11px] font-medium text-primary backdrop-blur-sm">
            {project.category}
          </span>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <h3
            id={headingId}
            className="font-display text-[1.05rem] leading-snug text-foreground"
          >
            {project.title}
          </h3>
          <p className="mt-2.5 flex-1 text-[13px] leading-6 text-muted">
            {project.description}
          </p>
          <div className="mt-4">
            <ProjectTags technologies={project.technologies} />
          </div>
          <ProjectLinks githubUrl={project.githubUrl} liveUrl={project.liveUrl} />
        </div>
      </GlassCard>
    </motion.article>
  );
}
