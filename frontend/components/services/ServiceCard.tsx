"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { ServiceIcon } from "@/components/services/ServiceIcon";
import { ServiceAction } from "@/components/services/ServiceAction";
import { fadeUp } from "@/lib/animations";
import { formatMoney } from "@/lib/format";
import type { PublicService } from "@/lib/data/presenters";

export interface ServiceCardProps {
  service: PublicService;
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

function priceLabel(service: PublicService): string {
  if (service.pricingType === "custom" || service.price == null) {
    return "Custom quote";
  }
  const amount = formatMoney(service.price, service.currency);
  return service.pricingType === "starting_from" ? `From ${amount}` : amount;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
  const reduceMotion = useReducedMotion();
  const headingId = `${service.slug}-title`;

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
      className="h-full min-w-0"
    >
      <GlassCard
        hover
        className="group flex h-full flex-col p-6 motion-reduce:transition-none"
      >
        <ServiceIcon name={service.icon} />
        <h3 id={headingId} className="mt-5 font-display text-xl text-foreground">
          {service.title}
        </h3>
        <p className="mt-3 flex-1 text-sm leading-6 text-muted">
          {service.shortDescription}
        </p>
        <ul className="mt-5 flex flex-wrap gap-2">
          {service.technologies.map((tech) => (
            <li key={tech}>
              <Badge>{tech}</Badge>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-sm font-semibold text-foreground">
          {priceLabel(service)}
        </p>
        <ServiceAction
          serviceId={service.id}
          title={service.title}
          purchasable={service.purchasable}
        />
      </GlassCard>
    </motion.article>
  );
}
