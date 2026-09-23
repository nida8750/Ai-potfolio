export const AUTOMATION_PRODUCT_IDS = [
  "leadflow",
  "mailpilot",
  "invoiceflow",
  "supportsync",
  "contentflow",
] as const;

export type AutomationProductId = (typeof AUTOMATION_PRODUCT_IDS)[number];

export type AutomationIconName =
  | "GitBranch"
  | "MailCheck"
  | "ReceiptText"
  | "Headphones"
  | "Sparkles";

export interface BusinessAutomation {
  id: AutomationProductId;
  name: string;
  subtitle: string;
  description: string;
  icon: AutomationIconName;
  accent: string;
  accentSecondary: string;
  webhookPath: string;
  steps: readonly string[];
  status: "template";
}

export const businessAutomations: readonly BusinessAutomation[] = [
  {
    id: "leadflow",
    name: "LeadFlow",
    subtitle: "Automated Lead Management",
    description:
      "Capture website and form leads, normalize the payload, persist the record, and alert admins.",
    icon: "GitBranch",
    accent: "#3B82F6",
    accentSecondary: "#22D3EE",
    webhookPath: "/nida-ai/leadflow",
    steps: ["Website/Form", "Normalize Lead", "Save Lead", "Admin Alert"],
    status: "template",
  },
  {
    id: "mailpilot",
    name: "MailPilot",
    subtitle: "Intelligent Email Processing",
    description:
      "Ingest inbound email events, classify intent, store the result, and route follow-up.",
    icon: "MailCheck",
    accent: "#8B5CF6",
    accentSecondary: "#A78BFA",
    webhookPath: "/nida-ai/mailpilot",
    steps: ["Email", "Classify", "Save", "Route"],
    status: "template",
  },
  {
    id: "invoiceflow",
    name: "InvoiceFlow",
    subtitle: "Automated Invoice Processing",
    description:
      "Accept invoice and order payloads, normalize fields, save the job, and notify operators.",
    icon: "ReceiptText",
    accent: "#10B981",
    accentSecondary: "#2DD4BF",
    webhookPath: "/nida-ai/invoiceflow",
    steps: ["Invoice", "Normalize", "Save", "Notify"],
    status: "template",
  },
  {
    id: "supportsync",
    name: "SupportSync",
    subtitle: "Customer Support Automation",
    description:
      "Triage support updates, keep the ticket record in sync, and escalate with an alert.",
    icon: "Headphones",
    accent: "#F97316",
    accentSecondary: "#FBBF24",
    webhookPath: "/nida-ai/supportsync",
    steps: ["Support Request", "Triage", "Save Ticket", "Alert"],
    status: "template",
  },
  {
    id: "contentflow",
    name: "ContentFlow",
    subtitle: "AI Content Workflow Automation",
    description:
      "Turn a content or project request into a prepared brief, save the job, and notify for review.",
    icon: "Sparkles",
    accent: "#EC4899",
    accentSecondary: "#D946EF",
    webhookPath: "/nida-ai/contentflow",
    steps: ["Content Request", "Prepare Brief", "Save Job", "Notify"],
    status: "template",
  },
] as const;

export function isAutomationProductId(value: string): value is AutomationProductId {
  return (AUTOMATION_PRODUCT_IDS as readonly string[]).includes(value);
}

export function getAutomationById(id: string): BusinessAutomation | undefined {
  return businessAutomations.find((item) => item.id === id);
}
