"""Decide which specialist or client-intent path should handle a turn."""

from __future__ import annotations

from app.agents.graph.state import AgentRoute, ClientIntent
from app.agents.llm import heuristic_route, llm_route

_HIRING = (
    "hire",
    "hiring",
    "work together",
    "work with you",
    "need you to build",
    "i'd like to hire",
    "i would like to hire",
    "can i hire",
)
_CONTACT = ("contact", "email", "linkedin", "github", "how can i reach")
_PROJECT = ("project", "portfolio piece", "case study", "show me a project")
_SERVICE = ("service", "offer", "what does nida", "what do you offer")
_TECHNICAL = (
    "langgraph",
    "fastapi",
    "supabase",
    "pgvector",
    "technology",
    "tech stack",
    "what technologies",
)
_RAG = ("rag", "knowledge base", "document chatbot", "retrieve")
_AUTOMATION = ("automate", "automation", "n8n", "leadflow", "workflow")


def _has(text: str, phrases: tuple[str, ...]) -> bool:
    return any(phrase in text for phrase in phrases)


def detect_client_intent(user_input: str) -> tuple[ClientIntent, str]:
    """Public-visitor intent. Does not invent professional facts."""
    text = (user_input or "").strip().lower()
    if not text:
        return "unknown", "empty"
    if _has(text, _HIRING):
        return "hiring", "keyword:hiring"
    if _has(text, _CONTACT):
        return "contact", "keyword:contact"
    if _has(text, _AUTOMATION):
        return "automation", "keyword:automation"
    if _has(text, _RAG):
        return "rag", "keyword:rag"
    if _has(text, _PROJECT):
        return "project", "keyword:project"
    if _has(text, _SERVICE):
        return "service", "keyword:service"
    if _has(text, _TECHNICAL):
        return "technical", "keyword:technical"
    return "portfolio", "keyword:portfolio_default"


def route_specialist(user_input: str, *, use_llm: bool = True) -> tuple[AgentRoute, str]:
    """Reuse the existing supervisor router (LLM when configured)."""
    if use_llm:
        return llm_route(user_input)
    return heuristic_route(user_input)


def specialist_for_intent(intent: ClientIntent) -> AgentRoute:
    if intent == "automation":
        return "automation"
    if intent == "rag":
        return "rag"
    if intent in {"technical"}:
        return "research"
    return "support"
