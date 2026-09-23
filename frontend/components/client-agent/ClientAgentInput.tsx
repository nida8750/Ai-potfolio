"use client";

import type { FormEvent, RefObject } from "react";
import { Send } from "lucide-react";
import { CLIENT_AGENT_BRAND } from "@/lib/client-agent/config";

interface ClientAgentInputProps {
  id: string;
  value: string;
  disabled?: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
}

export function ClientAgentInput({
  id,
  value,
  disabled = false,
  inputRef,
  onChange,
  onSubmit,
}: ClientAgentInputProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="flex items-center gap-2 border-t border-white/10 px-3 py-3"
    >
      <label className="sr-only" htmlFor={id}>
        Message {CLIENT_AGENT_BRAND.name}
      </label>
      <input
        ref={inputRef}
        id={id}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Ask anything…"
        autoComplete="off"
        enterKeyHint="send"
        className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted focus:border-accent/40 focus-visible:ring-2 focus-visible:ring-accent/50"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-40"
        aria-label="Send message"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
