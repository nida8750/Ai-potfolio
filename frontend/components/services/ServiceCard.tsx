"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Service } from "@/types/service";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { ServiceIcon } from "@/components/services/ServiceIcon";
import { fadeUp } from "@/lib/animations";

export interface ServiceCardProps {
  service: Service;
  index: number;
}

export function ServicesIntro({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={fadeUp}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

export function ServiceCard({ service, index }: ServiceCardProps) {
  const reduceMotion = useReducedMotion();
  const headingId = `${service.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-title`;

  return (
    <motion.article
      aria-labelledby={headingId}
      variants={fadeUp}
      initial={reduceMotion ? false : "hidden"}
      whileInView="visible"
      viewport={{ once: true, amount: 0.25 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }
      }
      className="h-full"
    >
      <GlassCard
        hover
        className="group flex h-full flex-col p-6 motion-reduce:transition-none"
      >
        <ServiceIcon name={service.icon ?? service.title} />
        <h3 id={headingId} className="mt-5 font-display text-xl text-foreground">
          {service.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted">
          {service.description}
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {service.technologies.map((tech) => (
            <li key={tech}>
              <Badge>{tech}</Badge>
            </li>
          ))}
        </ul>
      </GlassCard>
    </motion.article>
  );
}
