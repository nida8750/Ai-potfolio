/** Source ids for the five local n8n webhooks. UI copy lives in frontend/data/automations.ts. */
export const businessAutomations = [
  { id: "leadflow", webhook: "http://localhost:5678/webhook/nida-ai/leadflow" },
  { id: "mailpilot", webhook: "http://localhost:5678/webhook/nida-ai/mailpilot" },
  { id: "invoiceflow", webhook: "http://localhost:5678/webhook/nida-ai/invoiceflow" },
  { id: "supportsync", webhook: "http://localhost:5678/webhook/nida-ai/supportsync" },
  { id: "contentflow", webhook: "http://localhost:5678/webhook/nida-ai/contentflow" },
] as const;
