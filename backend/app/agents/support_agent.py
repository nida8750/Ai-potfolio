"""Support agent — portfolio/support questions via project_lookup."""

from __future__ import annotations

from app.agents.state import AgentState
from app.agents.tools.registry import invoke_tool


def support_node(state: AgentState) -> dict:
    query = state.get("input") or ""
    events = list(state.get("status_events") or [])
    events.append("tool_running")

    lookup = invoke_tool("project_lookup", {"query": query}, agent="support")
    catalog = invoke_tool("database_read", {"collection": "agents"}, agent="support")

    events.append("generating_response")
    output = (
        "Support response: I can help with Nida AI agents, RAG, and automation "
        f"products. Request: {query[:240] or '(empty)'}. "
        f"Projects: {(lookup.get('result') or {}).get('note')}. "
        f"Agents catalog: {(catalog.get('result') or {}).get('note')}."
    )
    return {
        "status_events": events,
        "tool_calls": [
            {"tool": "project_lookup", "arguments": {"query": query}},
            {"tool": "database_read", "arguments": {"collection": "agents"}},
        ],
        "tool_results": [lookup, catalog],
        "specialist_output": output,
    }
