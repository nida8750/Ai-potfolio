import { PERSON_NAME, ROLE } from "@/lib/constants";

/** Phase A local replies only. Later phases replace this with FastAPI. */

const replies: Array<{ match: RegExp; text: string }> = [
  {
    match: /service|offer|help/i,
    text: `${PERSON_NAME} builds AI agents, RAG knowledge systems, business automation with n8n, and voice AI. Use Contact to request a quote.`,
  },
  {
    match: /tech|stack|langgraph|n8n|rag/i,
    text: `The stack is Next.js, FastAPI, Supabase, LangGraph, RAG, and n8n. ${PERSON_NAME} is an ${ROLE}.`,
  },
  {
    match: /project|portfolio|work/i,
    text: "Featured work includes multi-agent automation, a knowledge-base copilot, a voice assistant, and a CRM pipeline. These are portfolio concepts, not claimed client engagements.",
  },
  {
    match: /agent/i,
    text: "Yes — multi-agent systems with tool calling, LangGraph, and MCP-style integrations. Share your workflow on the contact form to start.",
  },
];

export function stubAssistantReply(input: string): string {
  const hit = replies.find((item) => item.match.test(input));
  return (
    hit?.text ??
    `I'm ${PERSON_NAME}'s portfolio assistant. Ask about services, projects, or automation — or use Contact to send a real inquiry.`
  );
}
