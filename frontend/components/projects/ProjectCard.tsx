"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { Project } from "@/types/project";
import { GlassCard } from "@/components/ui/GlassCard";
import { ProjectLinks } from "@/components/projects/ProjectLinks";
import { ProjectTags } from "@/components/projects/ProjectTags";
import { fadeUp } from "@/lib/animations";

interface ProjectCardProps {
  project: Project;
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
        <div className="relative aspect-[16/10] overflow-hidden bg-surface-secondary">
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
        </div>
        <div className="flex flex-1 flex-col p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            {project.category}
          </p>
          <h3 id={headingId} className="mt-2 font-display text-xl text-foreground">
            {project.title}
          </h3>
          <p className="mt-3 flex-1 text-sm leading-6 text-muted">
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
