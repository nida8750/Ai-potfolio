import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    title: "Multi-Agent Business Automation",
    slug: "multi-agent-business-automation",
    category: "Multi-Agent Systems",
    description:
      "A concept system where specialized agents split research, operations, and follow-up across a shared workflow instead of a single prompt chain.",
    technologies: ["LangGraph", "CrewAI", "n8n", "Python"],
    image: "/images/projects/multi-agent-business-automation.svg",
    githubUrl: "#github",
    liveUrl: "#demo",
    featured: true,
  },
  {
    title: "AI Knowledge Base / RAG Copilot",
    slug: "ai-knowledge-base-rag-copilot",
    category: "RAG",
    description:
      "A retrieval-augmented copilot concept that answers from a curated knowledge base with source-aware reasoning rather than free-form generation.",
    technologies: ["MongoDB Vector Search", "Pinecone", "FastAPI", "Next.js"],
    image: "/images/projects/rag-copilot.svg",
    githubUrl: "#github",
    liveUrl: "#demo",
    featured: true,
  },
  {
    title: "AI Voice Support Agent",
    slug: "ai-voice-support-agent",
    category: "Voice AI",
    description:
      "A voice-first support concept that turns speech into reasoned actions and spoken replies over a live connection.",
    technologies: ["Speech-to-Text", "LLMs", "Text-to-Speech", "WebSockets"],
    image: "/images/projects/voice-support-agent.svg",
    githubUrl: "#github",
    liveUrl: "#demo",
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
    githubUrl: "#github",
    liveUrl: "#demo",
    featured: true,
  },
];
