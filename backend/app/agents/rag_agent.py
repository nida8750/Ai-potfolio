"""RAG agent — retrieves allowlisted knowledge; does not invent sources."""

from __future__ import annotations

from app.agents.state import AgentState
from app.agents.tools.registry import invoke_tool


def rag_node(state: AgentState) -> dict:
    query = state.get("input") or ""
    # Prefer the raw latest user ask if memory-prefixed.
    if "Latest USER message:" in query:
        query = query.split("Latest USER message:", 1)[1].strip()

    events = list(state.get("status_events") or [])
    events.append("searching_knowledge")

    user_id = state.get("user_id")
    result = invoke_tool(
        "rag_search",
        {"query": query, "top_k": 5, "user_id": user_id},
        agent="rag",
    )
    payload = result.get("result") or {}
    chunks = payload.get("chunks") or []

    if not chunks or not payload.get("grounded"):
        output = (
            "I could not find relevant information in the knowledge base for this "
            "question. Upload documents to a knowledge base and try again. "
            "I will not invent sources."
        )
    else:
        lines: list[str] = []
        sources: list[str] = []
        for chunk in chunks[:5]:
            if not isinstance(chunk, dict):
                continue
            content = str(chunk.get("content") or "")[:500]
            meta = chunk.get("metadata") or {}
            source = str(meta.get("source") or "unknown")
            sources.append(source)
            lines.append(f"- ({source}) {content}")
        unique_sources = sorted(set(sources))
        output = (
            "Grounded answer based on retrieved chunks:\n"
            + "\n".join(lines)
            + f"\nSources: {', '.join(unique_sources)}"
        )

    events.append("generating_response")
    return {
        "status_events": events,
        "tool_calls": [{"tool": "rag_search", "arguments": {"query": query}}],
        "tool_results": [result],
        "specialist_output": output,
    }
