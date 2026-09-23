"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AutomationFlowProps {
  steps: readonly string[];
  accent: string;
  className?: string;
}

export function AutomationFlow({ steps, accent, className }: AutomationFlowProps) {
  const reduceMotion = useReducedMotion();

  return (
    <ol className={cn("mt-4 space-y-2", className)}>
      {steps.map((step, index) => (
        <motion.li
          key={step}
          className="flex items-center gap-2.5 text-[12px] leading-5 text-muted"
          initial={reduceMotion ? false : { opacity: 0, x: -6 }}
          whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={
            reduceMotion ? { duration: 0 } : { delay: index * 0.05, duration: 0.35 }
          }
        >
          <span
            aria-hidden="true"
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold text-foreground"
            style={{
              borderColor: `${accent}55`,
              backgroundColor: `${accent}18`,
            }}
          >
            {index + 1}
          </span>
          <span className="min-w-0">{step}</span>
        </motion.li>
      ))}
    </ol>
  );
}
