"""Allowlisted n8n_workflow_trigger — Phase 7 automation service."""

from __future__ import annotations

from typing import Any

from app.agents.tools.registry import ToolSpec, register_tool

_ALLOWED_WORKFLOWS = frozenset(
    {
        "leadflow",
        "mailpilot",
        "invoiceflow",
        "supportsync",
        "contentflow",
    }
)


def _n8n_trigger(args: dict[str, Any]) -> dict[str, Any]:
    workflow = str(args.get("workflow") or "").strip().lower()
    if workflow not in _ALLOWED_WORKFLOWS:
        return {
            "ok": False,
            "error": "workflow_not_allowed",
            "allowed": sorted(_ALLOWED_WORKFLOWS),
        }

    from app.services import automation_service

    payload = args.get("input") if isinstance(args.get("input"), dict) else {}
    user_id = args.get("user_id")
    return automation_service.trigger_from_agent(
        product=workflow,
        user_id=str(user_id) if user_id else None,
        payload=payload,
    )


def register() -> None:
    register_tool(
        ToolSpec(
            name="n8n_workflow_trigger",
            description="Trigger an approved n8n automation product workflow.",
            handler=_n8n_trigger,
            allowed_agents=frozenset({"automation", "supervisor"}),
        )
    )
