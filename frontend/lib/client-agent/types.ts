export type ClientAgentRole = "assistant" | "user";

export type ClientAgentSection =
  | "home"
  | "services"
  | "automation"
  | "agents"
  | "projects"
  | "about"
  | "contact"
  | "other";

export interface ClientAgentMessage {
  id: string;
  role: ClientAgentRole;
  content: string;
}

export interface ClientAgentUiState {
  greeted: boolean;
  interacted: boolean;
}
