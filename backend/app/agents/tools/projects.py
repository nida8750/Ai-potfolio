"""Allowlisted project_lookup stub."""

from __future__ import annotations

from typing import Any

from app.agents.tools.registry import ToolSpec, register_tool


def _project_lookup(args: dict[str, Any]) -> dict[str, Any]:
    slug = str(args.get("slug") or "").strip().lower()[:120]
    query = str(args.get("query") or "").strip()[:200]
    return {
        "slug": slug or None,
        "query": query or None,
        "projects": [],
        "note": "empty_until_projects_loaded",
    }


def register() -> None:
    register_tool(
        ToolSpec(
            name="project_lookup",
            description="Look up published portfolio projects by slug or query.",
            handler=_project_lookup,
            allowed_agents=frozenset({"support", "research", "supervisor"}),
        )
    )
