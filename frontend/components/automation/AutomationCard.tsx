"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { AutomationBadge } from "@/components/automation/AutomationBadge";
import { AutomationFlow } from "@/components/automation/AutomationFlow";
import { AutomationIcon } from "@/components/automation/AutomationIcon";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { BusinessAutomation } from "@/data/automations";
import { fadeUp } from "@/lib/animations";

interface AutomationCardProps {
  automation: BusinessAutomation;
  index: number;
}

export function AutomationCard({ automation, index }: AutomationCardProps) {
  const reduceMotion = useReducedMotion();
  const headingId = `automation-${automation.id}-title`;

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
          : { delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }
      }
      className="h-full min-w-0"
    >
      <GlassCard hover className="group relative flex h-full flex-col overflow-hidden p-5">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-40 blur-3xl transition-opacity duration-300 group-hover:opacity-70"
          style={{
            background: `radial-gradient(circle, ${automation.accent}66, transparent 70%)`,
          }}
        />

        <div className="relative flex items-start justify-between gap-3">
          <AutomationIcon name={automation.icon} accent={automation.accent} />
          <div className="flex flex-wrap items-center justify-end gap-2">
            <AutomationBadge />
            <StatusBadge status={automation.status} />
          </div>
        </div>

        <h3
          id={headingId}
          className="relative mt-4 font-display text-[1.08rem] leading-snug text-foreground"
        >
          {automation.name}
        </h3>
        <p
          className="relative mt-1 text-[12px] font-medium tracking-wide"
          style={{ color: automation.accentSecondary }}
        >
          {automation.subtitle}
        </p>
        <p className="relative mt-2.5 flex-1 text-[13px] leading-6 text-muted">
          {automation.description}
        </p>

        <AutomationFlow steps={automation.steps} accent={automation.accent} />

        <Link
          href="#contact"
          className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
        >
          View Automation
          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only"> — contact about {automation.name}</span>
        </Link>
      </GlassCard>
    </motion.article>
  );
}
