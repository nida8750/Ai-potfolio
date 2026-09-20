import type { Service } from "@/types/service";

export const services: Service[] = [
  {
    title: "AI Agents",
    description:
      "Multi-agent systems that reason, use tools and execute workflows.",
    technologies: ["LangGraph", "CrewAI", "MCP", "Tool Calling"],
    icon: "agents",
  },
  {
    title: "RAG & Knowledge Systems",
    description:
      "Intelligent knowledge systems that retrieve and reason over business information.",
    technologies: [
      "MongoDB Vector Search",
      "Pinecone",
      "Semantic Search",
      "Agentic RAG",
    ],
    icon: "rag",
  },
  {
    title: "Business Automation",
    description:
      "Connected workflows that automate repetitive business processes.",
    technologies: ["n8n", "Webhooks", "REST APIs", "CRM Automation"],
    icon: "automation",
  },
  {
    title: "Voice AI",
    description:
      "Voice interfaces that connect speech, AI reasoning and automation.",
    technologies: ["Speech-to-Text", "LLMs", "Text-to-Speech", "WebSockets"],
    icon: "voice",
  },
];
