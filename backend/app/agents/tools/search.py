"""Allowlisted web/research search stub (Phase 4). No arbitrary URLs."""

from __future__ import annotations

from typing import Any

from app.agents.tools.registry import ToolSpec, register_tool

# Phase 4: deterministic stub. Real search providers land with Research phase hardening.
_SAFE_SNIPPETS = {
    "langgraph": "LangGraph orchestrates multi-agent workflows with typed state.",
    "rag": "RAG retrieves grounded chunks from a vector store before answering.",
    "n8n": "n8n runs approved business automation workflows via webhooks.",
}


def _search(args: dict[str, Any]) -> dict[str, Any]:
    query = str(args.get("query") or "").strip()[:500]
    if not query:
        return {"query": "", "hits": [], "note": "empty_query"}
    lower = query.lower()
    hits = [
        {"title": key, "snippet": value} for key, value in _SAFE_SNIPPETS.items() if key in lower
    ]
    if not hits:
        hits = [
            {
                "title": "portfolio_knowledge",
                "snippet": (
                    "No external fetch performed. Provide LLM/search keys later for live research."
                ),
            }
        ]
    return {"query": query, "hits": hits, "source": "allowlisted_stub"}


def register() -> None:
    register_tool(
        ToolSpec(
            name="search",
            description="Search approved portfolio knowledge snippets (no arbitrary URLs).",
            handler=_search,
            allowed_agents=frozenset({"research", "supervisor"}),
        )
    )
