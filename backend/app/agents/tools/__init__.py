"""Tool package — registers allowlisted handlers on import."""

from app.agents.tools import database, n8n, projects, rag, search
from app.agents.tools.registry import (
    ALLOWED_TOOL_NAMES,
    invoke_tool,
    list_tools,
    reset_registry_for_tests,
)

search.register()
database.register()
rag.register()
projects.register()
n8n.register()

__all__ = [
    "ALLOWED_TOOL_NAMES",
    "invoke_tool",
    "list_tools",
    "reset_registry_for_tests",
]
