"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ClientAgentMessage as Message } from "@/lib/client-agent/types";
import { cn } from "@/lib/utils";

interface ClientAgentMessageProps {
  message: Message;
}

export function ClientAgentMessage({ message }: ClientAgentMessageProps) {
  const reduceMotion = useReducedMotion();
  const isUser = message.role === "user";

  return (
    <motion.p
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.22 }}
      className={cn(
        "max-w-[92%] rounded-2xl px-3 py-2 text-[13px] leading-6",
        isUser
          ? "ml-auto bg-primary/25 text-foreground"
          : "border border-white/8 bg-white/[0.06] text-muted",
      )}
    >
      {message.content}
    </motion.p>
  );
}
