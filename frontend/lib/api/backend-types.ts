export type AutomationProduct =
  | "leadflow"
  | "mailpilot"
  | "invoiceflow"
  | "supportsync"
  | "contentflow";

export interface BackendEnvelope<T> {
  success: boolean;
  data?: T;
  error?: { code?: string; message?: string };
}

export interface AgentSummary {
  id: string;
  name: string;
  slug: string;
  description?: string;
  agent_type?: string;
  status?: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  status?: string;
  agent_id?: string | null;
  created_at?: string;
}

export interface ChatTurn {
  user_message?: { id: string; role: string; content: string };
  assistant_message?: { id: string; role: string; content: string };
  selected_agent?: string;
  final_response?: string;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  status?: string;
}

export interface LlmOps {
  configured: boolean;
  model?: string | null;
  provider?: string | null;
  router?: string | null;
}

export interface TokenUsageTotals {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  records_with_usage: number;
}

export interface DashboardOverview {
  total_agents: number;
  total_tasks: number;
  successful_runs: number;
  failed_runs: number;
  active_workflows: number;
  total_conversations: number;
  total_knowledge_bases: number;
  total_documents: number;
  recent_agent_activity: unknown[];
  recent_workflow_runs: unknown[];
  notifications: unknown[];
  llm?: LlmOps;
  token_usage?: TokenUsageTotals;
}
