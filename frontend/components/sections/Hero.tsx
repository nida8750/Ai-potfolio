"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Bot, Database, Download, MessageCircle, Mic, Sparkles, Workflow } from "lucide-react";
import { FloatingSkillCard } from "@/components/hero/FloatingSkillCard";
import { HeroBackground } from "@/components/hero/HeroBackground";
import { HeroCharacter } from "@/components/hero/HeroCharacter";
import { HeroStats } from "@/components/hero/HeroStats";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { HERO_COPY, HERO_GREETING, RESUME_FILENAME, RESUME_PATH, ROLE } from "@/lib/constants";
import { floatMotion, revealMotion } from "@/lib/animations";

const skillCards = [
  {
    title: "AI Agents",
    icon: <Bot className="h-4 w-4" aria-hidden="true" />,
    position: "lg:absolute lg:top-4 lg:left-0",
    delay: 0.42,
  },
  {
    title: "RAG",
    icon: <Database className="h-4 w-4" aria-hidden="true" />,
    position: "lg:absolute lg:top-8 lg:right-0",
    delay: 0.5,
  },
  {
    title: "Automation",
    icon: <Workflow className="h-4 w-4" aria-hidden="true" />,
    position: "lg:absolute lg:bottom-10 lg:left-2",
    delay: 0.58,
  },
  {
    title: "Voice AI",
    icon: <Mic className="h-4 w-4" aria-hidden="true" />,
    position: "lg:absolute lg:bottom-6 lg:right-2",
    delay: 0.66,
  },
] as const;

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      id="home"
      className="relative overflow-x-hidden min-h-[calc(100svh-4.5rem)] py-12 md:py-16"
    >
      <motion.div
        className="pointer-events-none absolute inset-0"
        {...revealMotion(reduceMotion, { delay: 0, duration: 0.35, y: 0 })}
      >
        <HeroBackground />
      </motion.div>

      <Container className="relative grid items-center gap-10 lg:grid-cols-2 lg:gap-8">
        <div className="min-w-0">
          <motion.p
            className="inline-flex items-center gap-2 text-sm font-medium text-accent"
            {...revealMotion(reduceMotion, { delay: 0.05, y: 10 })}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {HERO_GREETING}
          </motion.p>
          <motion.h1
            className="mt-4 font-display text-[2rem] leading-[1.15] tracking-tight text-foreground xs:text-[2.25rem] md:text-5xl lg:text-[3.15rem]"
            {...revealMotion(reduceMotion, { delay: 0.12, y: 16 })}
          >
            {ROLE}
          </motion.h1>
          <motion.p
            className="mt-5 max-w-xl text-sm leading-7 text-muted md:text-base md:leading-8"
            {...revealMotion(reduceMotion, { delay: 0.2, y: 14 })}
          >
            {HERO_COPY}
          </motion.p>
          <motion.ul
            className="mt-5 flex flex-wrap gap-2"
            {...revealMotion(reduceMotion, { delay: 0.24, y: 10 })}
          >
            <li>
              <Badge variant="purple">Agents</Badge>
            </li>
            <li>
              <Badge variant="blue">RAG</Badge>
            </li>
            <li>
              <Badge>Automation</Badge>
            </li>
            <li>
              <Badge variant="blue">Voice AI</Badge>
            </li>
          </motion.ul>
          <motion.div
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
            {...revealMotion(reduceMotion, { delay: 0.28, y: 12 })}
          >
            <Button href="#projects" size="lg" icon={<ArrowRight className="h-4 w-4" aria-hidden="true" />}>
              Explore My Work
            </Button>
            <Button
              href="#contact"
              variant="secondary"
              size="lg"
              icon={<MessageCircle className="h-4 w-4" aria-hidden="true" />}
            >
              Talk to My AI
            </Button>
            <Button
              href={RESUME_PATH}
              download={RESUME_FILENAME}
              variant="ghost"
              size="lg"
              icon={<Download className="h-4 w-4" aria-hidden="true" />}
            >
              Download Resume
            </Button>
          </motion.div>
          <motion.div
            className="mt-8 hidden lg:block"
            {...revealMotion(reduceMotion, { delay: 0.72, y: 12 })}
          >
            <HeroStats />
          </motion.div>
        </div>

        <div className="relative min-w-0">
          <motion.div
            className="mx-auto max-w-[420px]"
            {...revealMotion(reduceMotion, { delay: 0.32, scale: 0.96, y: 0 })}
          >
            <motion.div {...floatMotion(reduceMotion, 0.4)}>
              <HeroCharacter />
            </motion.div>
            <ul className="mt-6 grid grid-cols-2 gap-3 lg:mt-0 lg:contents">
              {skillCards.map((card) => (
                <motion.li
                  key={card.title}
                  className={card.position}
                  {...revealMotion(reduceMotion, { delay: card.delay, x: 16, y: 0 })}
                >
                  <motion.div {...floatMotion(reduceMotion, card.delay + 0.2)}>
                    <FloatingSkillCard
                      title={card.title}
                      icon={card.icon}
                      delay={card.delay}
                    />
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        <motion.div
          className="lg:hidden"
          {...revealMotion(reduceMotion, { delay: 0.74, y: 12 })}
        >
          <HeroStats />
        </motion.div>
      </Container>
    </section>
  );
}
