import { PERSON_NAME, SITE_NAME } from "@/lib/constants";
import type { ClientAgentSection, ClientAgentUiState } from "@/lib/client-agent/types";

export const CLIENT_AGENT_BRAND = {
  name: `${SITE_NAME} Assistant`,
  subtitle: `Your AI guide to ${PERSON_NAME.split(" ")[0]}'s work`,
  storageKey: "nida-client-agent-v1",
} as const;

export const CLIENT_AGENT_GREETING_DELAY_MS = 1800;

export const CLIENT_AGENT_WELCOME = `Hi! 👋 I'm ${PERSON_NAME.split(" ")[0]}'s AI assistant. I can help you explore her services, projects, technical expertise, and automation solutions.`;

export const CLIENT_AGENT_DEFAULT_SUGGESTIONS = [
  "What services does Nida offer?",
  "What AI technologies does she use?",
  "Tell me about her projects",
  "Can she build AI agents?",
  "Can she automate my business?",
  "Does she build RAG systems?",
  "Can I hire her?",
  "How can I contact her?",
] as const;

const SECTION_SUGGESTIONS: Record<ClientAgentSection, readonly string[]> = {
  home: CLIENT_AGENT_DEFAULT_SUGGESTIONS,
  services: [
    "Which service would fit my business?",
    "Can she build AI agents?",
    "Does she build RAG systems?",
    "Can I hire her?",
  ],
  automation: [
    "Can she automate my business?",
    "Does she work with n8n?",
    "What workflow types can she build?",
    "How can I start a project?",
  ],
  agents: [
    "Can she build a multi-agent system?",
    "What AI technologies does she use?",
    "Which service would fit my business?",
    "Can I hire her?",
  ],
  projects: [
    "Tell me about this project",
    "Show me a project related to business automation",
    "What technologies does she use?",
    "Can I hire her?",
  ],
  about: [
    "What is Nida's technical background?",
    "What AI technologies does she use?",
    "Tell me about her projects",
    "How can I contact her?",
  ],
  contact: [
    "How can I start a project?",
    "What should I include in an inquiry?",
    "Can I hire her?",
    "What services does Nida offer?",
  ],
  other: CLIENT_AGENT_DEFAULT_SUGGESTIONS,
};

export const CLIENT_AGENT_HIDDEN_PREFIXES = [
  "/dashboard",
  "/admin",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
] as const;

export function isClientAgentHiddenPath(pathname: string): boolean {
  return CLIENT_AGENT_HIDDEN_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function sectionFromHash(hash: string): ClientAgentSection {
  const key = hash.replace(/^#/, "").trim().toLowerCase();
  if (
    key === "services" ||
    key === "automation" ||
    key === "agents" ||
    key === "projects" ||
    key === "about" ||
    key === "contact"
  ) {
    return key;
  }
  if (!key || key === "home") {
    return "home";
  }
  return "other";
}

export function suggestionsForSection(section: ClientAgentSection): readonly string[] {
  return SECTION_SUGGESTIONS[section];
}

export function emptyUiState(): ClientAgentUiState {
  return { greeted: false, interacted: false };
}

export function readUiState(): ClientAgentUiState {
  if (typeof window === "undefined") {
    return emptyUiState();
  }
  try {
    const raw = window.localStorage.getItem(CLIENT_AGENT_BRAND.storageKey);
    if (!raw) {
      return emptyUiState();
    }
    const parsed = JSON.parse(raw) as Partial<ClientAgentUiState>;
    return {
      greeted: Boolean(parsed.greeted),
      interacted: Boolean(parsed.interacted),
    };
  } catch {
    return emptyUiState();
  }
}

export function writeUiState(next: ClientAgentUiState): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(CLIENT_AGENT_BRAND.storageKey, JSON.stringify(next));
  } catch {
    // Private mode or quota — UI still works without persistence.
  }
}
