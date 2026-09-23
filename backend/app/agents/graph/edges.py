"""Pure routing functions used as LangGraph conditional edges."""

from __future__ import annotations

from typing import Literal

from app.agents.graph.state import AgentState
from app.agents.supervisor import route_after_supervisor

AfterGuard = Literal["detect_intent", "blocked"]
AfterClientIntent = Literal[
    "retrieve_portfolio",
    "retrieve_rag",
    "run_research",
    "run_automation",
    "qualify_client",
]
AfterReply = Literal["qualify_client", "generate_response"]
AfterQualify = Literal["create_lead", "generate_response"]


def after_guard(state: AgentState) -> AfterGuard:
    if state.get("status") == "blocked" or state.get("error"):
        return "blocked"
    return "detect_intent"


def after_supervisor(state: AgentState) -> str:
    """Existing specialist routes: research | rag | automation | support."""
    return route_after_supervisor(state)


def after_client_intent(state: AgentState) -> AfterClientIntent:
    intent = state.get("intent") or "portfolio"
    if intent == "hiring":
        return "qualify_client"
    if intent == "automation":
        return "run_automation"
    if intent == "rag":
        return "retrieve_rag"
    if intent == "technical":
        return "run_research"
    return "retrieve_portfolio"


def after_specialist(_state: AgentState) -> Literal["validate_response"]:
    return "validate_response"


def after_validate(state: AgentState) -> AfterReply:
    if state.get("intent") == "hiring" and not (state.get("lead_data") or {}).get("confirmed"):
        return "qualify_client"
    return "generate_response"


def after_qualify(state: AgentState) -> AfterQualify:
    lead = state.get("lead_data") or {}
    if lead.get("confirmed") and lead.get("email") and lead.get("name"):
        return "create_lead"
    return "generate_response"
