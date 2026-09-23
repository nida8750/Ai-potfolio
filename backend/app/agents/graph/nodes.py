"""Graph nodes. Existing specialists are reused; new nodes stay non-persistent."""

from __future__ import annotations

import re

from app.agents.automation_agent import automation_node as _run_automation_existing
from app.agents.graph.router import detect_client_intent, specialist_for_intent
from app.agents.graph.state import AgentState, LeadDraft
from app.agents.rag_agent import rag_node as _retrieve_rag_existing
from app.agents.research_agent import research_node as _run_research_existing
from app.agents.supervisor import supervisor_node as _supervisor_existing
from app.agents.support_agent import support_node as _support_existing
from app.utils.security import redact_for_logs

_INJECTION = re.compile(
    r"ignore (all|any|previous|prior) (instructions|prompts)|reveal (the )?(system prompt|api key)",
    re.I,
)
_SECRET_KEYS = ("password", "api_key", "access_token", "refresh_token", "secret", "authorization")


def _text(state: AgentState) -> str:
    return (state.get("input_text") or state.get("input") or "").strip()


def _events(state: AgentState, extra: str) -> list[str]:
    events = list(state.get("status_events") or [])
    events.append(extra)
    return events


def guard_input(state: AgentState) -> dict[str, object]:
    """Reject empty / injection-style turns. Never keep secrets in state."""
    raw = _text(state)
    if not raw:
        return {
            "status": "blocked",
            "error": "empty_input",
            "response": "Please share a question about Nida's work.",
            "final_response": "Please share a question about Nida's work.",
            "status_events": _events(state, "error"),
        }
    if _INJECTION.search(raw):
        return {
            "status": "blocked",
            "error": "prompt_injection",
            "response": "I can only help with Nida's public portfolio, services, and projects.",
            "final_response": (
                "I can only help with Nida's public portfolio, services, and projects."
            ),
            "status_events": _events(state, "error"),
            "input": redact_for_logs(raw)[:500],
            "input_text": redact_for_logs(raw)[:500],
        }
    cleaned = raw
    for key in _SECRET_KEYS:
        cleaned = re.sub(rf"{key}\s*[:=]\s*\S+", f"{key}=[REDACTED]", cleaned, flags=re.I)
    return {
        "status": "ok",
        "error": None,
        "input": cleaned[:8000],
        "input_text": cleaned[:8000],
        "status_events": list(state.get("status_events") or []),
    }


def detect_intent(state: AgentState) -> dict[str, object]:
    intent, reason = detect_client_intent(_text(state))
    return {
        "intent": intent,
        "selected_agent": specialist_for_intent(intent),
        "route_reason": reason,
        "metadata": {"route_reason": reason, "intent": intent},
        "status_events": _events(state, "agent_selected"),
    }


def supervisor(state: AgentState) -> dict[str, object]:
    return _supervisor_existing(state)


def retrieve_portfolio(state: AgentState) -> dict[str, object]:
    """Public catalog lookup via the existing support specialist."""
    return _support_existing(state)


def retrieve_rag(state: AgentState) -> dict[str, object]:
    result = _retrieve_rag_existing(state)
    chunks: list[dict[str, object]] = []
    for item in result.get("tool_results") or []:
        if not isinstance(item, dict):
            continue
        raw_payload = item.get("result")
        if not isinstance(raw_payload, dict):
            continue
        raw_chunks = raw_payload.get("chunks")
        if not isinstance(raw_chunks, list):
            continue
        for chunk in raw_chunks:
            if not isinstance(chunk, dict):
                continue
            raw_meta = chunk.get("metadata")
            meta = raw_meta if isinstance(raw_meta, dict) else {}
            chunks.append(
                {
                    "source": str(meta.get("source") or "unknown"),
                    "content": str(chunk.get("content") or "")[:500],
                    "score": float(chunk.get("score") or 0),
                    "document_id": str(meta.get("document_id") or ""),
                }
            )
    result["retrieved_context"] = chunks
    return result


def run_research(state: AgentState) -> dict[str, object]:
    return _run_research_existing(state)


def run_automation(state: AgentState) -> dict[str, object]:
    return _run_automation_existing(state)


def qualify_client(state: AgentState) -> dict[str, object]:
    """Ask one qualification question. Does not invent answers or persist a lead."""
    existing = dict(state.get("lead_data") or {})
    lead: LeadDraft = {
        "conversation_id": state.get("conversation_id") or "",
        "confirmed": bool(existing.get("confirmed")),
        "persisted": False,
    }
    for key in ("name", "email", "company", "project_type", "problem", "requirements"):
        value = existing.get(key)
        if isinstance(value, str) and value.strip():
            lead[key] = value.strip()  # type: ignore[literal-required]

    if not lead.get("problem"):
        question = "What are you looking to build?"
        status: str = "awaiting_user"
    elif not lead.get("project_type"):
        question = (
            "Is this an AI agent, RAG system, business automation, voice AI, or something else?"
        )
        status = "awaiting_user"
    elif not lead.get("name") or not lead.get("email"):
        question = "I can help get this started. What name and email should Nida use to reply?"
        status = "awaiting_user"
    elif not lead.get("confirmed"):
        question = (
            "I can send these project details to Nida. Would you like me to submit the inquiry?"
        )
        status = "awaiting_user"
    else:
        question = "I have enough to prepare an inquiry. I will not invent any missing details."
        status = "ok"

    return {
        "lead_data": lead,
        "status": status,
        "specialist_output": question,
        "status_events": _events(state, "generating_response"),
    }


def create_lead(state: AgentState) -> dict[str, object]:
    """Prepare a lead draft only. Persistence + n8n happen in a later step."""
    lead = dict(state.get("lead_data") or {})
    lead["persisted"] = False
    if not lead.get("confirmed") or not lead.get("email"):
        return {
            "lead_data": lead,
            "status": "awaiting_user",
            "specialist_output": (
                "I still need a confirmed name and email before I can send an inquiry."
            ),
            "status_events": _events(state, "generating_response"),
        }
    return {
        "lead_data": lead,
        "status": "lead_pending",
        "specialist_output": (
            "Inquiry details are ready. They are not stored yet — "
            "Supabase + LeadFlow wiring is the next implementation step."
        ),
        "status_events": _events(state, "generating_response"),
    }


def validate_response(state: AgentState) -> dict[str, object]:
    events = [e for e in (state.get("status_events") or [])]
    error = state.get("error")
    if error:
        events.append("error")
        text = "The agent run failed. Please try again."
        return {
            "status_events": events,
            "status": "error",
            "response": text,
            "final_response": text,
            "error": error,
        }
    specialist = (state.get("specialist_output") or "").strip() or "No response was produced."
    cleaned = specialist.replace("chain-of-thought", "").strip()
    events.append("completed")
    return {
        "status_events": events,
        "status": state.get("status") or "ok",
        "response": cleaned,
        "final_response": cleaned,
        "error": None,
    }


def generate_response(state: AgentState) -> dict[str, object]:
    text = (
        state.get("response")
        or state.get("final_response")
        or state.get("specialist_output")
        or "I don't have that information in my current portfolio knowledge."
    )
    cleaned = str(text).replace("chain-of-thought", "").strip()
    return {
        "response": cleaned,
        "final_response": cleaned,
        "status_events": _events(state, "completed"),
    }
