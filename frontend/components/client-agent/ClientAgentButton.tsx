"use client";

import type { RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ClientAgentAvatar } from "@/components/client-agent/ClientAgentAvatar";
import { floatMotion } from "@/lib/animations";
import { CLIENT_AGENT_BRAND } from "@/lib/client-agent/config";
import { cn } from "@/lib/utils";

interface ClientAgentButtonProps {
  open: boolean;
  panelId: string;
  buttonRef: RefObject<HTMLButtonElement | null>;
  onToggle: () => void;
}

export function ClientAgentButton({
  open,
  panelId,
  buttonRef,
  onToggle,
}: ClientAgentButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div {...floatMotion(reduceMotion, 0.2)}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Minimize assistant" : `Chat with ${CLIENT_AGENT_BRAND.name}`}
        onClick={onToggle}
        className={cn(
          "group inline-flex items-center gap-2 rounded-full border border-white/15 bg-surface/90 p-1.5 pr-3 text-sm text-foreground shadow-[0_10px_30px_rgb(0_0_0_/_0.35)] backdrop-blur-xl",
          "hover:border-accent/50 hover:shadow-[0_0_24px_rgb(56_189_248_/_0.28)]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50",
          open && "pr-1.5 sm:pr-1.5",
        )}
      >
        <ClientAgentAvatar size="sm" pulse={!open} />
        <span
          className={cn(
            "hidden pr-1 font-medium sm:inline",
            open && "sm:hidden",
          )}
        >
          Chat with my AI assistant
        </span>
      </button>
    </motion.div>
  );
}
