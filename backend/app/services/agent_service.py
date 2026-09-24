"""Agent catalog + LangGraph execution service."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any
from uuid import UUID, uuid4

from app.agents.graph import run_agent_graph
from app.agents.tools.registry import ALLOWED_TOOL_NAMES, list_tools
from app.utils.errors import AgentExecutionError, NotFoundError, ValidationError

# In-memory catalog for Phase 4. Persisted agents table is used when Supabase
# is configured in later phases — we never invent dashboard stats here.
AGENT_CATALOG: list[dict[str, Any]] = [
    {
        "id": "00000000-0000-4000-8000-000000000001",
        "name": "Supervisor",
        "slug": "supervisor",
        "description": "Routes requests to research, RAG, automation, or support.",
        "agent_type": "supervisor",
        "status": "active",
    },
    {
        "id": "00000000-0000-4000-8000-000000000002",
        "name": "Research Agent",
        "slug": "research",
        "description": "Allowlisted research and catalog lookup.",
        "agent_type": "research",
        "status": "active",
    },
    {
        "id": "00000000-0000-4000-8000-000000000003",
        "name": "RAG Agent",
        "slug": "rag",
        "description": "Grounded answers from the knowledge base.",
        "agent_type": "rag",
        "status": "active",
    },
    {
        "id": "00000000-0000-4000-8000-000000000004",
        "name": "Automation Agent",
        "slug": "automation",
        "description": "Triggers approved n8n workflows.",
        "agent_type": "automation",
        "status": "active",
    },
    {
        "id": "00000000-0000-4000-8000-000000000005",
        "name": "Support Agent",
        "slug": "support",
        "description": "Handles support and portfolio questions.",
        "agent_type": "support",
        "status": "active",
    },
]


@dataclass(frozen=True, slots=True)
class AgentRunResult:
    run_id: str
    agent_id: str
    selected_agent: str | None
    status_events: list[str]
    final_response: str
    tool_calls: list[dict[str, Any]]
    error: str | None


def list_agents() -> list[dict[str, Any]]:
    return list(AGENT_CATALOG)


def get_agent(agent_id: str) -> dict[str, Any]:
    for agent in AGENT_CATALOG:
        if agent["id"] == agent_id or agent["slug"] == agent_id:
            return agent
    raise NotFoundError("Agent not found.")


def run_agent(
    agent_id: str,
    *,
    message: str,
    user_id: str | None = None,
) -> AgentRunResult:
    if not message or not message.strip():
        raise ValidationError("message is required.")

    agent = get_agent(agent_id)
    # Force specialist when a non-supervisor agent is targeted.
    forced = agent["agent_type"] if agent["agent_type"] != "supervisor" else None
    text = message.strip()
    if forced and forced != "supervisor":
        # Prefix soft hint so heuristic router prefers this specialist when useful;
        # the graph still starts at supervisor for a unified audit trail.
        hints = {
            "research": "research this: ",
            "rag": "from my knowledge base: ",
            "automation": "automate with workflow: ",
            "support": "support request: ",
        }
        text = hints.get(forced, "") + text

    try:
        result = run_agent_graph(
            text,
            user_id=user_id,
            metadata={"requested_agent": agent["slug"]},
        )
    except Exception as exc:  # noqa: BLE001
        raise AgentExecutionError("Agent execution failed.") from exc

    return AgentRunResult(
        run_id=str(uuid4()),
        agent_id=str(agent["id"]),
        selected_agent=result.get("selected_agent"),
        status_events=list(result.get("status_events") or []),
        final_response=str(result.get("final_response") or ""),
        tool_calls=[dict(call) for call in (result.get("tool_calls") or [])],
        error=result.get("error"),
    )


def tools_catalog() -> dict[str, Any]:
    return {
        "allowed": sorted(ALLOWED_TOOL_NAMES),
        "tools": list_tools(),
    }


def parse_agent_uuid(value: str) -> UUID | None:
    try:
        return UUID(value)
    except ValueError:
        return None
