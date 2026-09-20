"use client";

import { useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download, MessageCircle, Sparkles, X } from "lucide-react";
import { FloatingSkillCard } from "@/components/hero/FloatingSkillCard";
import { HeroBackground } from "@/components/hero/HeroBackground";
import { HeroCharacter } from "@/components/hero/HeroCharacter";
import { HeroStats } from "@/components/hero/HeroStats";
import { AnimatedBorder } from "@/components/ui/AnimatedBorder";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import {
  FLOATING_SKILLS,
  HERO_COPY,
  HERO_GREETING,
  PERSON_NAME,
  RESUME_FILENAME,
  RESUME_PATH,
  ROLE,
} from "@/lib/constants";
import {
  fadeIn,
  fadeUp,
  floating,
  motionSafe,
  scaleIn,
  slideFromRight,
  staggerContainer,
} from "@/lib/animations";
import { cn } from "@/lib/utils";

const cardLayout = [
  "lg:absolute lg:top-6 lg:right-0",
  "lg:absolute lg:top-28 lg:-left-6",
  "lg:absolute lg:bottom-28 lg:-left-2",
  "lg:absolute lg:top-1/2 lg:-right-4",
  "lg:absolute lg:bottom-8 lg:right-8",
];

export function Hero() {
  const reduceMotion = useReducedMotion();
  const dialogTitleId = useId();
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [resumeMessage, setResumeMessage] = useState<string | null>(null);

  async function handleResumeDownload() {
    try {
      const response = await fetch(RESUME_PATH, { method: "HEAD" });
      if (!response.ok) {
        setResumeMessage(
          "Resume file is not available yet. Use Hire Me and I will send it directly.",
        );
        return;
      }

      const link = document.createElement("a");
      link.href = RESUME_PATH;
      link.download = RESUME_FILENAME;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setResumeMessage(null);
    } catch {
      setResumeMessage(
        "Resume file is not available yet. Use Hire Me and I will send it directly.",
      );
    }
  }

  return (
    <section id="home" className="relative overflow-hidden pt-8 pb-16 md:pt-12 md:pb-24">
      <HeroBackground />
      <Container className="relative grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8">
        <motion.div {...motionSafe(reduceMotion)} variants={staggerContainer}>
          <motion.p
            variants={fadeIn}
            className="inline-flex items-center gap-2 text-sm font-medium text-blue"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {HERO_GREETING}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="mt-4 font-display text-[2rem] leading-[1.15] tracking-tight text-ink xs:text-[2.25rem] mob:text-[2.4rem] wide:text-[2.55rem] md:text-5xl lg:text-[3.35rem]"
          >
            {ROLE}
          </motion.h1>
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-xl text-sm leading-7 text-muted md:text-base md:leading-8"
          >
            {HERO_COPY}
          </motion.p>
          <motion.div
            variants={fadeUp}
            className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap"
          >
            <Button href="#projects" size="lg">
              Explore My Work
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={() => setAssistantOpen(true)}
            >
              Talk to My AI
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => {
                void handleResumeDownload();
              }}
            >
              Download Resume
              <Download className="h-4 w-4" aria-hidden="true" />
            </Button>
          </motion.div>
          {resumeMessage ? (
            <p role="status" className="mt-3 text-sm text-blue">
              {resumeMessage}
            </p>
          ) : null}
          <motion.div variants={fadeUp}>
            <HeroStats />
          </motion.div>
        </motion.div>

        <motion.div
          className="relative"
          {...motionSafe(reduceMotion)}
          variants={scaleIn}
          transition={{ delay: reduceMotion ? 0 : 0.55 }}
        >
          <div className="relative mx-auto max-w-[420px]">
            <AnimatedBorder className="rounded-[28px]">
              <div className="rounded-[27px] bg-canvas/80 p-3 md:p-5">
                <HeroCharacter />
              </div>
            </AnimatedBorder>
            <motion.ul
              className="mt-6 grid grid-cols-2 gap-3 wide:grid-cols-2 lg:mt-0 lg:contents"
              {...motionSafe(reduceMotion)}
              variants={staggerContainer}
            >
              {FLOATING_SKILLS.map((skill, index) => (
                <motion.li
                  key={skill.label}
                  variants={reduceMotion ? fadeIn : slideFromRight}
                  className={cn(
                    index === FLOATING_SKILLS.length - 1 && "col-span-2 justify-self-center lg:col-span-1",
                    cardLayout[index],
                  )}
                >
                  <motion.div
                    variants={reduceMotion ? fadeIn : floating}
                    animate={reduceMotion ? undefined : "visible"}
                  >
                    <FloatingSkillCard label={skill.label} icon={skill.icon} />
                  </motion.div>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </motion.div>
      </Container>

      {assistantOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/70 p-4 backdrop-blur-sm sm:items-center"
          role="presentation"
          onClick={() => setAssistantOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={dialogTitleId}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id={dialogTitleId} className="font-display text-xl text-ink">
                Talk to {PERSON_NAME.split(" ")[0]} AI
              </h2>
              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10"
                aria-label="Close assistant panel"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              The conversational assistant is a later phase. This control is here
              so the interface is ready — no chatbot is running yet.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button href="#contact" onClick={() => setAssistantOpen(false)}>
                Hire Me instead
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setAssistantOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
