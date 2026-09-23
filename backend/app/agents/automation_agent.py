"""Automation agent — triggers only allowlisted n8n workflows."""

from __future__ import annotations

import re

from app.agents.state import AgentState
from app.agents.tools.registry import invoke_tool

_WORKFLOW_ALIASES = {
    "leadflow": "leadflow",
    "lead": "leadflow",
    "mailpilot": "mailpilot",
    "email": "mailpilot",
    "invoiceflow": "invoiceflow",
    "invoice": "invoiceflow",
    "supportsync": "supportsync",
    "support sync": "supportsync",
    "contentflow": "contentflow",
    "content": "contentflow",
}


def _detect_workflow(text: str) -> str | None:
    lower = text.lower()
    for key, workflow in _WORKFLOW_ALIASES.items():
        if re.search(rf"\b{re.escape(key)}\b", lower):
            return workflow
    return None


def automation_node(state: AgentState) -> dict:
    query = state.get("input") or ""
    events = list(state.get("status_events") or [])
    events.append("workflow_running")

    workflow = _detect_workflow(query)
    if not workflow:
        output = (
            "I can run one of these approved automations: "
            "LeadFlow, MailPilot, InvoiceFlow, SupportSync, ContentFlow. "
            "Name the product to proceed."
        )
        events.append("generating_response")
        return {
            "status_events": events,
            "tool_calls": [],
            "tool_results": [],
            "specialist_output": output,
        }

    result = invoke_tool(
        "n8n_workflow_trigger",
        {
            "workflow": workflow,
            "input": {"message": query[:1000]},
            "user_id": state.get("user_id"),
        },
        agent="automation",
    )
    events.append("generating_response")
    payload = result.get("result") or {}
    status = payload.get("status") or (payload.get("output") or {}).get("status")
    return {
        "status_events": events,
        "tool_calls": [{"tool": "n8n_workflow_trigger", "arguments": {"workflow": workflow}}],
        "tool_results": [result],
        "specialist_output": (
            f"Automation '{workflow}' accepted for execution "
            f"(status={status}). "
            "Live n8n dispatch runs when N8N_WEBHOOK_* env vars are configured."
        ),
    }
