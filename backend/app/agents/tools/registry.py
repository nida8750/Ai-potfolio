"""Allowlisted tool registry.

Agents may only call tools registered here. Arbitrary shell, Python, SQL,
and unrestricted URL fetching are forbidden.
"""

from __future__ import annotations

import re
from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

from app.utils.errors import AgentExecutionError, ValidationError

ToolHandler = Callable[[dict[str, Any]], dict[str, Any]]

# Explicit allowlist — never auto-discover arbitrary callables.
ALLOWED_TOOL_NAMES = frozenset(
    {
        "search",
        "database_read",
        "rag_search",
        "project_lookup",
        "n8n_workflow_trigger",
    }
)

BLOCKED_TOOL_PATTERNS = (
    re.compile(r"shell|bash|cmd|powershell|exec|eval|subprocess", re.I),
    re.compile(r"sql|query_raw|execute_sql", re.I),
    re.compile(r"fetch_url|http_request|wget|curl", re.I),
    re.compile(r"python|code_interpreter|repl", re.I),
)

# SSRF / open-fetch protection for any future HTTP tools.
ALLOWED_EXTERNAL_HOSTS = frozenset(
    {
        "api.openai.com",
        "api.anthropic.com",
    }
)


@dataclass(frozen=True, slots=True)
class ToolSpec:
    name: str
    description: str
    handler: ToolHandler
    allowed_agents: frozenset[str]


_REGISTRY: dict[str, ToolSpec] = {}


def register_tool(spec: ToolSpec) -> None:
    if spec.name not in ALLOWED_TOOL_NAMES:
        raise AgentExecutionError(f"Tool '{spec.name}' is not on the allowlist.")
    for pattern in BLOCKED_TOOL_PATTERNS:
        if pattern.search(spec.name):
            raise AgentExecutionError(f"Tool '{spec.name}' matches a blocked pattern.")
    _REGISTRY[spec.name] = spec


def get_tool(name: str) -> ToolSpec:
    if name not in ALLOWED_TOOL_NAMES or name not in _REGISTRY:
        raise ValidationError(f"Tool '{name}' is not allowed.", code="TOOL_NOT_ALLOWED")
    return _REGISTRY[name]


def list_tools() -> list[dict[str, str]]:
    return [
        {"name": spec.name, "description": spec.description}
        for spec in sorted(_REGISTRY.values(), key=lambda s: s.name)
    ]


def invoke_tool(
    name: str,
    arguments: dict[str, Any] | None,
    *,
    agent: str,
) -> dict[str, Any]:
    """Run an allowlisted tool. Rejects unknown names and agent mismatches."""
    # Prompt-injection defense: only exact allowlisted names; ignore model-provided aliases.
    if not isinstance(name, str) or name.strip() != name or name not in ALLOWED_TOOL_NAMES:
        raise ValidationError("Tool is not allowed.", code="TOOL_NOT_ALLOWED")
    for pattern in BLOCKED_TOOL_PATTERNS:
        if pattern.search(name):
            raise ValidationError("Tool is blocked.", code="TOOL_BLOCKED")

    # Reject injection via nested executable fields.
    if isinstance(arguments, dict):
        for banned in ("code", "sql", "shell", "command", "__import__", "eval"):
            if banned in arguments:
                raise ValidationError(
                    "Tool arguments contain blocked fields.", code="TOOL_ARGS_BLOCKED"
                )

    spec = get_tool(name)
    if agent not in spec.allowed_agents and "all" not in spec.allowed_agents:
        raise ValidationError(
            f"Agent '{agent}' may not call tool '{name}'.",
            code="TOOL_AGENT_DENIED",
        )

    safe_args = arguments if isinstance(arguments, dict) else {}
    safe_args = {
        k: v
        for k, v in safe_args.items()
        if k not in {"code", "sql", "shell", "command", "__import__", "eval"}
    }
    result = spec.handler(safe_args)
    return {
        "tool": name,
        "ok": True,
        "result": result,
    }


def reset_registry_for_tests() -> None:
    """Clear and re-bind built-in tools (tests only)."""
    _REGISTRY.clear()
    from app.agents.tools import database, n8n, projects, rag, search

    search.register()
    database.register()
    rag.register()
    projects.register()
    n8n.register()
