"""Supervisor agent — routes to a specialist. Never exposes chain-of-thought."""

from __future__ import annotations

from app.agents.llm import llm_route
from app.agents.state import AgentState


def supervisor_node(state: AgentState) -> dict:
    user_input = state.get("input") or ""
    agent, reason = llm_route(user_input)
    events = list(state.get("status_events") or [])
    events.append("agent_selected")
    return {
        "selected_agent": agent,
        "route_reason": reason,
        "status_events": events,
        "metadata": {
            **(state.get("metadata") or {}),
            "route_reason": reason,
        },
    }


def route_after_supervisor(state: AgentState) -> str:
    selected = state.get("selected_agent") or "support"
    if selected in {"research", "rag", "automation", "support"}:
        return selected
    return "support"
