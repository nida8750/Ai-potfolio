"""Allowlisted database_read — catalog/metadata only, never arbitrary SQL."""

from __future__ import annotations

from typing import Any

from app.agents.tools.registry import ToolSpec, register_tool

_ALLOWED_COLLECTIONS = frozenset({"agents", "projects", "workflows"})


def _database_read(args: dict[str, Any]) -> dict[str, Any]:
    collection = str(args.get("collection") or "").strip().lower()
    if collection not in _ALLOWED_COLLECTIONS:
        return {
            "ok": False,
            "error": "collection_not_allowed",
            "allowed": sorted(_ALLOWED_COLLECTIONS),
        }
    # Phase 4: structural stub. Phase 5+ wires repositories.
    return {
        "ok": True,
        "collection": collection,
        "rows": [],
        "note": "empty_until_persisted",
    }


def register() -> None:
    register_tool(
        ToolSpec(
            name="database_read",
            description="Read allowlisted catalog collections (agents, projects, workflows).",
            handler=_database_read,
            allowed_agents=frozenset({"research", "support", "supervisor"}),
        )
    )
