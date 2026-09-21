"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ServiceCard } from "@/components/services/ServiceCard";
import { Container } from "@/components/ui/Container";
import { GlowOrb } from "@/components/ui/GlowOrb";
import { GridBackground } from "@/components/ui/GridBackground";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { services } from "@/data/services";

export function Services() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="services"
      aria-labelledby="services-heading"
      className="relative overflow-hidden py-16 md:py-24"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <GridBackground />
        <GlowOrb
          color="purple"
          className="-left-20 top-10 h-56 w-56 opacity-60"
        />
      </div>
      <Container className="relative">
        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.4 }}
        >
          <SectionHeading
            eyebrow="WHAT I BUILD"
            title="AI SYSTEMS BUILT TO AUTOMATE"
            titleId="services-heading"
            description="Intelligent systems designed to connect AI models, agents, knowledge, workflows, and business processes."
          />
        </motion.div>
        <ul className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service, index) => (
            <li key={service.title}>
              <ServiceCard service={service} index={index} />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
