"""Conversation memory and context-window management.

Never stores API keys, passwords, JWTs, or n8n secrets in memory context.
"""

from __future__ import annotations

from typing import Any

from app.services import conversation_service

# Rough token budget for prior turns passed into the agent graph.
_MAX_CHARS = 6000
_RECENT_MESSAGES = 12


def summarize_older_messages(messages: list[dict[str, Any]]) -> str | None:
    """Compress older turns into a short summary string."""
    if len(messages) <= _RECENT_MESSAGES:
        return None
    older = messages[:-_RECENT_MESSAGES]
    bits: list[str] = []
    for msg in older[-20:]:
        role = str(msg.get("role") or "?")
        content = str(msg.get("content") or "").replace("\n", " ").strip()
        if not content:
            continue
        bits.append(f"{role}: {content[:160]}")
    if not bits:
        return None
    joined = " | ".join(bits)
    return f"Earlier conversation summary: {joined[:1200]}"


def build_memory_context(*, conversation_id: str, user_id: str) -> dict[str, Any]:
    """Assemble prior messages + recent agent runs for the next turn."""
    messages = conversation_service.list_messages(conversation_id=conversation_id, user_id=user_id)
    runs = conversation_service.list_agent_runs(conversation_id=conversation_id, user_id=user_id)[
        :5
    ]

    summary = summarize_older_messages(messages)
    recent = messages[-_RECENT_MESSAGES:]

    lines: list[str] = []
    if summary:
        lines.append(summary)
    for msg in recent:
        role = str(msg.get("role") or "")
        content = str(msg.get("content") or "").strip()
        if role in {"USER", "ASSISTANT", "SYSTEM"} and content:
            lines.append(f"{role}: {content}")

    context_text = "\n".join(lines)
    if len(context_text) > _MAX_CHARS:
        context_text = context_text[-_MAX_CHARS:]

    safe_runs = [
        {
            "id": r.get("id"),
            "status": r.get("status"),
            "agent_id": r.get("agent_id"),
            "created_at": r.get("created_at"),
            # Never include raw tool secrets from outputs.
            "selected_agent": (r.get("output") or {}).get("selected_agent")
            if isinstance(r.get("output"), dict)
            else None,
        }
        for r in runs
    ]

    return {
        "context_text": context_text,
        "message_count": len(messages),
        "recent_runs": safe_runs,
        "has_summary": summary is not None,
    }


def compose_agent_input(user_message: str, memory: dict[str, Any]) -> str:
    """Combine memory context with the latest user message for the graph."""
    context = str(memory.get("context_text") or "").strip()
    latest = user_message.strip()
    if not context:
        return latest
    return (
        "Conversation memory (do not repeat secrets; answer the latest user turn):\n"
        f"{context}\n\n"
        f"Latest USER message: {latest}"
    )
