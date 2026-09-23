"""Agent API schemas."""

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class AgentSummary(BaseModel):
    id: UUID | str
    name: str
    slug: str
    description: str
    agent_type: str
    status: str


class AgentRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    message: str = Field(min_length=1, max_length=8000)
    # Intentionally no user_id / role fields — identity comes from the token.


class AgentRunResponseData(BaseModel):
    run_id: str
    agent_id: str
    selected_agent: str | None
    status_events: list[str]
    final_response: str
    tool_calls: list[dict[str, Any]] = Field(default_factory=list)
    error: str | None = None


class ToolsCatalogData(BaseModel):
    allowed: list[str]
    tools: list[dict[str, str]]


StatusEvent = Literal[
    "agent_selected",
    "searching_knowledge",
    "tool_running",
    "workflow_running",
    "generating_response",
    "completed",
    "error",
]
