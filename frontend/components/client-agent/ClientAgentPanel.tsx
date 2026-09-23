"use client";

import type { FormEvent, RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { RotateCcw, X } from "lucide-react";
import { ClientAgentAvatar } from "@/components/client-agent/ClientAgentAvatar";
import { ClientAgentInput } from "@/components/client-agent/ClientAgentInput";
import { ClientAgentMessage } from "@/components/client-agent/ClientAgentMessage";
import { ClientAgentStatus } from "@/components/client-agent/ClientAgentStatus";
import { ClientAgentSuggestions } from "@/components/client-agent/ClientAgentSuggestions";
import { ClientAgentTyping } from "@/components/client-agent/ClientAgentTyping";
import { CLIENT_AGENT_BRAND } from "@/lib/client-agent/config";
import type { ClientAgentMessage as Message } from "@/lib/client-agent/types";

interface ClientAgentPanelProps {
  panelId: string;
  inputId: string;
  messages: Message[];
  suggestions: readonly string[];
  input: string;
  typing: boolean;
  backendOn: boolean | null;
  inputRef: RefObject<HTMLInputElement | null>;
  listRef: RefObject<HTMLDivElement | null>;
  onInputChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
  onSelectSuggestion: (text: string) => void;
  onClose: () => void;
  onReset: () => void;
}

export function ClientAgentPanel({
  panelId,
  inputId,
  messages,
  suggestions,
  input,
  typing,
  backendOn,
  inputRef,
  listRef,
  onInputChange,
  onSubmit,
  onSelectSuggestion,
  onClose,
  onReset,
}: ClientAgentPanelProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      id={panelId}
      role="dialog"
      aria-label={CLIENT_AGENT_BRAND.name}
      aria-modal="false"
      initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
      transition={{ duration: reduceMotion ? 0 : 0.22 }}
      className="pointer-events-auto flex h-[min(28rem,calc(100svh-7.5rem))] w-[min(22rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/15 bg-surface/95 shadow-[0_20px_60px_rgb(0_0_0_/_0.45),0_0_24px_rgb(139_92_246_/_0.18)] backdrop-blur-xl sm:h-[min(30rem,calc(100svh-8rem))] sm:w-[min(23rem,calc(100vw-2rem))]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <ClientAgentAvatar size="sm" />
          <div className="min-w-0">
            <p className="font-display text-sm text-foreground">{CLIENT_AGENT_BRAND.name}</p>
            <p className="text-[12px] text-muted">{CLIENT_AGENT_BRAND.subtitle}</p>
            <ClientAgentStatus backendOn={backendOn} />
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={onReset}
            className="rounded-full border border-white/15 p-2 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            aria-label="Start a new conversation"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/15 p-2 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
            aria-label="Close assistant"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </header>

      <div
        ref={listRef}
        className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3"
        aria-live="polite"
      >
        {messages.map((message) => (
          <ClientAgentMessage key={message.id} message={message} />
        ))}
        {typing ? <ClientAgentTyping /> : null}
        <ClientAgentSuggestions items={suggestions} onSelect={onSelectSuggestion} />
      </div>

      <ClientAgentInput
        id={inputId}
        value={input}
        disabled={typing}
        inputRef={inputRef}
        onChange={onInputChange}
        onSubmit={onSubmit}
      />
    </motion.section>
  );
}
