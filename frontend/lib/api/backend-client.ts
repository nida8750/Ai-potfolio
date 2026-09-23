import { apiRequest } from "@/lib/api/client";
import type {
  AgentSummary,
  AutomationProduct,
  ChatTurn,
  ConversationSummary,
  DashboardOverview,
  KnowledgeBase,
} from "@/lib/api/backend-types";

/** Browser helpers — always go through Next.js `/api/ai/*`, never FastAPI keys. */

export function listAgents() {
  return apiRequest<{ agents: AgentSummary[]; tools: unknown[] }>("/api/ai/agents");
}

export function runAgent(agentId: string, message: string) {
  return apiRequest<{ final_response?: string; selected_agent?: string }>(
    `/api/ai/agents?id=${encodeURIComponent(agentId)}`,
    { method: "POST", json: { message } },
  );
}

export function listConversations() {
  return apiRequest<{ conversations: ConversationSummary[] }>("/api/ai/conversations");
}

export function createConversation(input?: { title?: string; agent_id?: string }) {
  return apiRequest<ConversationSummary>("/api/ai/conversations", {
    method: "POST",
    json: input ?? {},
  });
}

export function postConversationMessage(
  conversationId: string,
  content: string,
  options?: { agent_id?: string; stream?: boolean },
) {
  return apiRequest<ChatTurn>(`/api/ai/conversations/${conversationId}/messages`, {
    method: "POST",
    json: { content, ...options },
  });
}

export function listKnowledgeBases() {
  return apiRequest<{ knowledge_bases: KnowledgeBase[] }>("/api/ai/knowledge-bases");
}

export function createKnowledgeBase(name: string, description = "") {
  return apiRequest<KnowledgeBase>("/api/ai/knowledge-bases", {
    method: "POST",
    json: { name, description },
  });
}

export function triggerAutomation(product: AutomationProduct, payload: Record<string, unknown> = {}) {
  return apiRequest<{ product: string; n8n_configured: boolean }>(
    `/api/ai/automation/${product}`,
    { method: "POST", json: { payload } },
  );
}

export function listAutomationProducts() {
  return apiRequest<{ products: unknown[] }>("/api/ai/automation/products");
}

export function listAutomationRuns() {
  return apiRequest<{ runs: unknown[] }>("/api/ai/automation/runs");
}

export function fetchAiDashboard() {
  return apiRequest<DashboardOverview>("/api/ai/dashboard");
}
