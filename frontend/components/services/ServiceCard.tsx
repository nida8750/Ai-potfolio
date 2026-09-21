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

function priceLabel(service: PublicService): string | null {
  if (service.pricingType === "custom" || service.price == null) {
    return null;
  }
  const amount = formatMoney(service.price, service.currency);
  return service.pricingType === "starting_from" ? `From ${amount}` : amount;
}

export function ServiceCard({ service, index }: ServiceCardProps) {
  const reduceMotion = useReducedMotion();
  const headingId = `${service.slug}-title`;
  const price = priceLabel(service);

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
        className="group flex h-full flex-col p-5 motion-reduce:transition-none"
      >
        <ServiceIcon name={service.icon} />
        <h3
          id={headingId}
          className="mt-4 font-display text-[1.05rem] leading-snug text-foreground"
        >
          {service.title}
        </h3>
        <p className="mt-2.5 flex-1 text-[13px] leading-6 text-muted">
          {service.shortDescription}
        </p>

        <ul className="mt-4 grid grid-cols-2 gap-2">
          {service.technologies.map((tech) => (
            <li key={tech} className="min-w-0">
              <Badge className="w-full justify-center truncate">{tech}</Badge>
            </li>
          ))}
        </ul>

        {price ? (
          <p className="mt-4 text-sm font-semibold text-foreground">{price}</p>
        ) : null}

        <ServiceAction
          serviceId={service.id}
          title={service.title}
          purchasable={service.purchasable}
        />
      </GlassCard>
    </motion.article>
  );
}
