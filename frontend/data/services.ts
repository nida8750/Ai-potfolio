import type { Service } from "@/types/service";

export const services: Service[] = [
  {
    title: "AI Agents",
    description:
      "Multi-agent systems, task automation, tool calling, and MCP integration.",
    technologies: ["LangGraph", "CrewAI", "AutoGen", "MCP"],
    icon: "agents",
  },
  {
    title: "RAG & Knowledge Systems",
    description:
      "Semantic search, vector databases, document processing, and grounded responses.",
    technologies: ["MongoDB", "Pinecone", "ChromaDB", "LlamaIndex"],
    icon: "rag",
  },
  {
    title: "Business Automation",
    description:
      "n8n workflows, CRM integration, API automation, and email and webhook systems.",
    technologies: ["n8n", "Make", "Zapier", "REST APIs"],
    icon: "automation",
  },
  {
    title: "Voice AI",
    description:
      "Voice assistants, customer support, sales agents, and real-time communication.",
    technologies: ["STT", "LLM", "TTS", "WebSockets"],
    icon: "voice",
  },
];
