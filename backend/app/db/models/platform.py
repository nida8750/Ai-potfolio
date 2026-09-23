"""Pydantic models mirroring Phase 2 tables.

Profiles / projects / notifications stay compatible with the existing Next.js
schema (id = auth.users.id, name, image, read). AI platform tables are new.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="ignore")


UserRole = Literal["USER", "ADMIN"]
AgentStatus = Literal["draft", "active", "archived"]
ConversationStatus = Literal["active", "archived", "closed"]
MessageRole = Literal["USER", "ASSISTANT", "SYSTEM", "TOOL"]
RunStatus = Literal["pending", "running", "succeeded", "failed", "cancelled"]
WorkflowStatus = Literal["draft", "active", "paused", "archived"]
KnowledgeStatus = Literal["active", "archived"]
DocumentStatus = Literal["pending", "processing", "ready", "failed"]


class Profile(OrmModel):
    """Matches frontend `profiles`: id is auth.users.id (not a separate auth_user_id)."""

    id: UUID
    email: str
    name: str
    phone: str | None = None
    role: UserRole = "USER"
    avatar_url: str | None = None
    status: str = "active"
    created_at: datetime | None = None
    updated_at: datetime | None = None


class Project(OrmModel):
    """Matches frontend `projects` (`image`, not `image_url`)."""

    id: UUID
    title: str
    slug: str
    category: str
    description: str
    technologies: list[str] = Field(default_factory=list)
    image: str | None = None
    image_key: str | None = None
    github_url: str | None = None
    live_url: str | None = None
    featured: bool = False
    is_published: bool = False
    sort_order: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None


class Notification(OrmModel):
    """Matches frontend `notifications` (`read`, not `is_read`)."""

    id: UUID
    user_id: UUID
    type: str
    title: str
    message: str
    read: bool = False
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None


class AuditLog(OrmModel):
    id: UUID
    actor_id: UUID
    action: str
    entity_type: str
    entity_id: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None


class Agent(OrmModel):
    id: UUID
    name: str
    slug: str
    description: str = ""
    system_prompt: str = ""
    agent_type: str
    status: AgentStatus = "draft"
    configuration: dict[str, Any] = Field(default_factory=dict)
    created_by: UUID | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class Conversation(OrmModel):
    id: UUID
    user_id: UUID
    agent_id: UUID | None = None
    title: str = "New conversation"
    status: ConversationStatus = "active"
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class Message(OrmModel):
    id: UUID
    conversation_id: UUID
    role: MessageRole
    content: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    token_usage: dict[str, Any] | None = None
    created_at: datetime | None = None


class AgentRun(OrmModel):
    id: UUID
    conversation_id: UUID | None = None
    agent_id: UUID | None = None
    status: RunStatus = "pending"
    input: dict[str, Any] = Field(default_factory=dict)
    output: dict[str, Any] | None = None
    execution_time_ms: int | None = None
    error: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None
    completed_at: datetime | None = None


class Workflow(OrmModel):
    id: UUID
    name: str
    description: str = ""
    workflow_type: str
    n8n_workflow_id: str | None = None
    status: WorkflowStatus = "draft"
    configuration: dict[str, Any] = Field(default_factory=dict)
    created_by: UUID | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class WorkflowRun(OrmModel):
    id: UUID
    workflow_id: UUID
    user_id: UUID
    status: RunStatus = "pending"
    input: dict[str, Any] = Field(default_factory=dict)
    output: dict[str, Any] | None = None
    error: str | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None


class KnowledgeBase(OrmModel):
    id: UUID
    name: str
    description: str = ""
    owner_id: UUID
    status: KnowledgeStatus = "active"
    created_at: datetime | None = None
    updated_at: datetime | None = None


class Document(OrmModel):
    id: UUID
    knowledge_base_id: UUID
    name: str
    storage_path: str
    mime_type: str | None = None
    file_size: int | None = None
    status: DocumentStatus = "pending"
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None
    updated_at: datetime | None = None


class DocumentChunk(OrmModel):
    id: UUID
    document_id: UUID
    content: str
    embedding: list[float] | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
    created_at: datetime | None = None
