import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    title: "Multi-Agent Business Automation",
    slug: "multi-agent-business-automation",
    category: "AI Agents + Automation",
    description:
      "A complete system where multiple AI agents handle business workflows, CRM updates, email follow-ups, and more.",
    technologies: ["LangGraph", "CrewAI", "n8n", "MongoDB"],
    image: "/images/projects/multi-agent-business-automation.svg",
    featured: true,
  },
  {
    title: "AI Knowledge Base Copilot",
    slug: "ai-knowledge-base-copilot",
    category: "RAG System",
    description:
      "Chat with your documents using retrieval-augmented generation with citations, secure access, and a dashboard.",
    technologies: ["React", "FastAPI", "Pinecone", "MongoDB"],
    image: "/images/projects/rag-copilot.svg",
    featured: true,
  },
  {
    title: "Voice Agent Assistant",
    slug: "voice-agent-assistant",
    category: "Voice AI",
    description:
      "Real-time voice support built from speech-to-text, an LLM reasoning step, and text-to-speech.",
    technologies: ["FastAPI", "Twilio", "MongoDB", "WebSockets"],
    image: "/images/projects/voice-support-agent.svg",
    featured: true,
  },
  {
    title: "CRM Automation Pipeline",
    slug: "crm-automation-pipeline",
    category: "Automation",
    description:
      "A pipeline concept that connects inbound events to CRM updates, routing, and follow-up without manual copy-paste.",
    technologies: ["n8n", "REST APIs", "Webhooks", "CRM Automation"],
    image: "/images/projects/crm-automation.svg",
    featured: true,
  },
];
