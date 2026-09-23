"""Conversation / chat schemas."""

from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

StreamEventName = Literal[
    "agent_selected",
    "searching_knowledge",
    "tool_running",
    "workflow_running",
    "generating_response",
    "completed",
    "error",
]


class CreateConversationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, max_length=200)
    agent_id: str | None = Field(default=None, max_length=80)


class PostMessageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    content: str = Field(min_length=1, max_length=8000)
    agent_id: str | None = Field(default=None, max_length=80)
    stream: bool = False


class ConversationData(BaseModel):
    id: UUID | str
    user_id: UUID | str
    agent_id: UUID | str | None = None
    title: str
    status: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: str | None = None
    updated_at: str | None = None


class MessageData(BaseModel):
    id: UUID | str
    conversation_id: UUID | str
    role: Literal["USER", "ASSISTANT", "SYSTEM", "TOOL"]
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: str | None = None
