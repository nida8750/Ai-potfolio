"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";
import { ClientAgentButton } from "@/components/client-agent/ClientAgentButton";
import { ClientAgentPanel } from "@/components/client-agent/ClientAgentPanel";
import {
  CLIENT_AGENT_GREETING_DELAY_MS,
  CLIENT_AGENT_WELCOME,
  emptyUiState,
  isClientAgentHiddenPath,
  readUiState,
  sectionFromHash,
  suggestionsForSection,
  writeUiState,
} from "@/lib/client-agent/config";
import { stubAssistantReply } from "@/lib/client-agent/prompts";
import type { ClientAgentMessage, ClientAgentUiState } from "@/lib/client-agent/types";
import { cn } from "@/lib/utils";

function welcomeMessage(): ClientAgentMessage {
  return { id: "welcome", role: "assistant", content: CLIENT_AGENT_WELCOME };
}

export function ClientAgent() {
  const pathname = usePathname();
  const hidden = isClientAgentHiddenPath(pathname ?? "/");
  const panelId = useId();
  const inputId = `${panelId}-input`;
  const reduceMotion = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [backendOn, setBackendOn] = useState<boolean | null>(null);
  const [section, setSection] = useState(sectionFromHash(""));
  const [messages, setMessages] = useState<ClientAgentMessage[]>([welcomeMessage()]);
  const [greetingOpen, setGreetingOpen] = useState(false);
  const [, setUi] = useState(emptyUiState);

  const suggestions = useMemo(() => suggestionsForSection(section).slice(0, 4), [section]);

  const persistUi = useCallback((patch: Partial<ClientAgentUiState>) => {
    const next = { ...readUiState(), ...patch };
    setUi(next);
    writeUiState(next);
  }, []);

  useEffect(() => {
    if (hidden) {
      return;
    }
    let cancelled = false;
    fetch("/api/health", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (!cancelled) {
          setBackendOn(Boolean(payload?.data?.fastapi?.reachable));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setBackendOn(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [hidden]);

  useEffect(() => {
    if (hidden) {
      return;
    }

    function updateSection() {
      const hash = window.location.hash;
      if (hash) {
        setSection(sectionFromHash(hash));
        return;
      }
      const offset = 140;
      let current = "home";
      for (const id of ["home", "services", "automation", "agents", "projects", "about", "contact"]) {
        const node = document.getElementById(id);
        if (node && node.getBoundingClientRect().top <= offset) {
          current = id;
        }
      }
      setSection(sectionFromHash(`#${current}`));
    }

    updateSection();
    window.addEventListener("hashchange", updateSection);
    window.addEventListener("scroll", updateSection, { passive: true });
    return () => {
      window.removeEventListener("hashchange", updateSection);
      window.removeEventListener("scroll", updateSection);
    };
  }, [hidden]);

  useEffect(() => {
    if (hidden) {
      return;
    }
    const timer = window.setTimeout(() => {
      const stored = readUiState();
      if (stored.greeted || stored.interacted) {
        setUi(stored);
        return;
      }
      setGreetingOpen(true);
      persistUi({ greeted: true });
    }, CLIENT_AGENT_GREETING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [hidden, persistUi]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, typing, open]);

  useEffect(() => {
    if (!open && !greetingOpen) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        setGreetingOpen(false);
        buttonRef.current?.focus();
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [greetingOpen, open]);

  const send = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || typing) {
        return;
      }
      persistUi({ greeted: true, interacted: true });
      setGreetingOpen(false);
      setOpen(true);
      const userMessage: ClientAgentMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setTyping(true);
      window.setTimeout(() => {
        const reply: ClientAgentMessage = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: stubAssistantReply(trimmed),
        };
        setMessages((prev) => [...prev, reply]);
        setTyping(false);
      }, reduceMotion ? 0 : 420);
    },
    [persistUi, reduceMotion, typing],
  );

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    send(input);
  }

  function toggle() {
    persistUi({ greeted: true, interacted: true });
    setGreetingOpen(false);
    setOpen((prev) => {
      const next = !prev;
      if (!next) {
        window.setTimeout(() => buttonRef.current?.focus(), 0);
      }
      return next;
    });
  }

  function closePanel() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function resetConversation() {
    setMessages([welcomeMessage()]);
    setInput("");
    setTyping(false);
  }

  if (hidden) {
    return null;
  }

  return (
    <div
      className={cn(
        "pointer-events-none fixed z-50 flex flex-col items-end gap-3",
        "right-3 bottom-3",
        "sm:right-4 sm:bottom-4",
        "lg:right-6 lg:bottom-6",
      )}
    >
      <AnimatePresence>
        {open ? (
          <ClientAgentPanel
            key="client-agent-panel"
            panelId={panelId}
            inputId={inputId}
            messages={messages}
            suggestions={suggestions}
            input={input}
            typing={typing}
            backendOn={backendOn}
            inputRef={inputRef}
            listRef={listRef}
            onInputChange={setInput}
            onSubmit={onSubmit}
            onSelectSuggestion={send}
            onClose={closePanel}
            onReset={resetConversation}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {!open && greetingOpen ? (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
            className="pointer-events-auto w-[min(18rem,calc(100vw-5.5rem))] rounded-2xl border border-white/15 bg-surface/95 p-3 text-[13px] leading-5 text-muted shadow-[0_12px_32px_rgb(0_0_0_/_0.4)] backdrop-blur-xl"
            role="status"
          >
            <div className="flex items-start justify-between gap-2">
              <p>{CLIENT_AGENT_WELCOME}</p>
              <button
                type="button"
                onClick={() => setGreetingOpen(false)}
                className="rounded-full p-1 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
                aria-label="Dismiss greeting"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-auto">
        <ClientAgentButton
          open={open}
          panelId={panelId}
          buttonRef={buttonRef}
          onToggle={toggle}
        />
      </div>
    </div>
  );
}
