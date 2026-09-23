"""LangGraph package.

Step 1: state / nodes / edges / router.
Compile + run_agent_graph stay here so existing imports keep working.
Step 2 will move compile into graph.py / flow.py.
"""

from __future__ import annotations

from functools import lru_cache
from typing import Any

from langgraph.graph import END, START, StateGraph

from app.agents.graph.edges import after_supervisor
from app.agents.graph.nodes import (
    retrieve_rag,
    run_automation,
    run_research,
    supervisor,
    validate_response,
)
from app.agents.graph.state import AgentState, empty_state
from app.agents.support_agent import support_node

_SAFE_EVENTS = frozenset(
    {
        "agent_selected",
        "searching_knowledge",
        "tool_running",
        "workflow_running",
        "generating_response",
        "completed",
        "error",
    }
)


def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("supervisor", supervisor)
    graph.add_node("research", run_research)
    graph.add_node("rag", retrieve_rag)
    graph.add_node("automation", run_automation)
    graph.add_node("support", support_node)
    graph.add_node("validator", validate_response)

    graph.add_edge(START, "supervisor")
    graph.add_conditional_edges(
        "supervisor",
        after_supervisor,
        {
            "research": "research",
            "rag": "rag",
            "automation": "automation",
            "support": "support",
        },
    )
    graph.add_edge("research", "validator")
    graph.add_edge("rag", "validator")
    graph.add_edge("automation", "validator")
    graph.add_edge("support", "validator")
    graph.add_edge("validator", END)
    return graph.compile()


@lru_cache
def get_compiled_graph():
    return build_graph()


def run_agent_graph(
    user_input: str,
    *,
    user_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> AgentState:
    """Execute one supervisor→specialist→validator pass."""
    import app.agents.tools  # noqa: F401

    state = empty_state(user_input, user_id=user_id)
    if metadata:
        state["metadata"] = {str(k): str(v) for k, v in metadata.items()}
    result = get_compiled_graph().invoke(state)
    events = [e for e in (result.get("status_events") or []) if e in _SAFE_EVENTS]
    result["status_events"] = events
    return result  # type: ignore[return-value]


__all__ = [
    "AgentState",
    "build_graph",
    "empty_state",
    "get_compiled_graph",
    "run_agent_graph",
]
