"""Research agent — allowlisted search + database_read only."""

from __future__ import annotations

from app.agents.state import AgentState
from app.agents.tools.registry import invoke_tool


def research_node(state: AgentState) -> dict:
    query = state.get("input") or ""
    events = list(state.get("status_events") or [])
    events.append("tool_running")

    search_result = invoke_tool("search", {"query": query}, agent="research")
    db_result = invoke_tool("database_read", {"collection": "projects"}, agent="research")

    hits = (search_result.get("result") or {}).get("hits") or []
    snippets = "; ".join(
        f"{h.get('title')}: {h.get('snippet')}" for h in hits[:3] if isinstance(h, dict)
    )
    output = (
        f"Research summary for: {query[:200]}\n"
        f"Findings: {snippets or 'No matching snippets in the allowlisted index.'}\n"
        f"Catalog check: {(db_result.get('result') or {}).get('note', 'ok')}"
    )
    events.append("generating_response")
    return {
        "status_events": events,
        "tool_calls": [
            {"tool": "search", "arguments": {"query": query}},
            {"tool": "database_read", "arguments": {"collection": "projects"}},
        ],
        "tool_results": [search_result, db_result],
        "specialist_output": output,
    }
