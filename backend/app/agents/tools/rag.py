"""Allowlisted rag_search — wired to the Phase 6 RAG service."""

from __future__ import annotations

from typing import Any

from app.agents.tools.registry import ToolSpec, register_tool


def _rag_search(args: dict[str, Any]) -> dict[str, Any]:
    query = str(args.get("query") or "").strip()[:1000]
    top_k = min(int(args.get("top_k") or 5), 10)
    user_id = args.get("user_id")
    knowledge_base_id = args.get("knowledge_base_id")
    if not query:
        return {"query": "", "chunks": [], "note": "empty_query", "grounded": False}

    # Lazy import avoids circular imports at tool registration time.
    from app.services import rag_service

    if not user_id:
        return {
            "query": query,
            "top_k": top_k,
            "chunks": [],
            "grounded": False,
            "note": "user_context_required",
        }

    return rag_service.search_for_user(
        owner_id=str(user_id),
        query=query,
        top_k=top_k,
        knowledge_base_id=str(knowledge_base_id) if knowledge_base_id else None,
    )


def register() -> None:
    register_tool(
        ToolSpec(
            name="rag_search",
            description="Retrieve top-k chunks from the user knowledge base (pgvector).",
            handler=_rag_search,
            allowed_agents=frozenset({"rag", "supervisor"}),
        )
    )
