"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Database,
  Download,
  Layers,
  Mic,
  Sparkles,
} from "lucide-react";
import { FloatingSkillCard } from "@/components/hero/FloatingSkillCard";
import { HeroBackground } from "@/components/hero/HeroBackground";
import { HeroCharacter } from "@/components/hero/HeroCharacter";
import { HeroStats } from "@/components/hero/HeroStats";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  HERO_COPY,
  HERO_GREETING,
  HERO_HEADLINE_ACCENT,
  HERO_HEADLINE_LEAD,
  RESUME_FILENAME,
  RESUME_PATH,
} from "@/lib/constants";
import { floatMotion, revealMotion } from "@/lib/animations";

const skillCards = [
  {
    title: "AI Agents",
    icon: <Bot className="h-4 w-4" aria-hidden="true" />,
    position: "lg:absolute lg:-left-2 lg:top-2 xl:-left-6",
    delay: 0.42,
  },
  {
    title: "RAG",
    icon: <Database className="h-4 w-4" aria-hidden="true" />,
    position: "lg:absolute lg:-right-2 lg:top-0 xl:-right-6",
    delay: 0.5,
  },
  {
    title: "Voice Agent",
    icon: <Mic className="h-4 w-4" aria-hidden="true" />,
    position: "lg:absolute lg:-right-4 lg:top-1/3 xl:-right-10",
    delay: 0.58,
  },
  {
    title: "Full Stack",
    icon: <Layers className="h-4 w-4" aria-hidden="true" />,
    position: "lg:absolute lg:-right-2 lg:bottom-16 xl:-right-6",
    delay: 0.66,
  },
] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="home"
      className="relative overflow-hidden py-10 md:py-14 lg:min-h-[calc(100svh-4.5rem)] lg:py-16"
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        {...revealMotion(reduceMotion, { delay: 0, duration: 0.35, y: 0 })}
      >
        <HeroBackground />
      </motion.div>

      <Container className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-10">
        <div className="min-w-0">
          <motion.p
            className="inline-flex items-center gap-2 text-base font-medium text-foreground"
            {...revealMotion(reduceMotion, { delay: 0.05, y: 10 })}
          >
            <Sparkles className="h-4 w-4 text-accent" aria-hidden="true" />
            {HERO_GREETING}
          </motion.p>

          <motion.h1
            className="mt-5 font-display text-[2.1rem] leading-[1.1] tracking-tight break-words text-foreground xs:text-[2.4rem] md:text-5xl lg:text-[3.25rem]"
            {...revealMotion(reduceMotion, { delay: 0.12, y: 16 })}
          >
            {HERO_HEADLINE_LEAD}{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              {HERO_HEADLINE_ACCENT}
            </span>
          </motion.h1>

          <motion.p
            className="mt-5 max-w-xl text-sm leading-7 text-muted md:text-base md:leading-8"
            {...revealMotion(reduceMotion, { delay: 0.2, y: 14 })}
          >
            {HERO_COPY}
          </motion.p>

          <motion.div
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            {...revealMotion(reduceMotion, { delay: 0.28, y: 12 })}
          >
            <Button
              href="#projects"
              size="lg"
              className="w-full sm:w-auto"
              icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}
            >
              Explore My Work
            </Button>
            <Button
              href={RESUME_PATH}
              download={RESUME_FILENAME}
              variant="secondary"
              size="lg"
              className="w-full sm:w-auto"
              icon={<Download className="h-4 w-4" aria-hidden="true" />}
            >
              Download Resume
            </Button>
          </motion.div>

          <motion.div
            className="mt-8 max-w-lg"
            {...revealMotion(reduceMotion, { delay: 0.36, y: 12 })}
          >
            <HeroStats />
          </motion.div>
        </div>

        <div className="relative order-first min-w-0 lg:order-none">
          <motion.div
            className="relative mx-auto max-w-[420px]"
            {...revealMotion(reduceMotion, { delay: 0.32, scale: 0.96, y: 0 })}
          >
            <motion.div {...floatMotion(reduceMotion, 0.4)}>
              <HeroCharacter priority />
            </motion.div>

            <ul className="mt-5 grid grid-cols-2 gap-2.5 lg:mt-0 lg:contents">
              {skillCards.map((card) => (
                <motion.li
                  key={card.title}
                  className={card.position}
                  {...revealMotion(reduceMotion, { delay: card.delay, x: 16, y: 0 })}
                >
                  <motion.div {...floatMotion(reduceMotion, card.delay + 0.2)}>
                    <FloatingSkillCard title={card.title} icon={card.icon} />
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
