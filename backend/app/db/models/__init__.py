"""Typed table shapes aligned with backend migrations and the existing frontend."""

from app.db.models.platform import (
    Agent,
    AgentRun,
    AuditLog,
    Conversation,
    Document,
    DocumentChunk,
    KnowledgeBase,
    Message,
    Notification,
    Profile,
    Project,
    Workflow,
    WorkflowRun,
)

__all__ = [
    "Agent",
    "AgentRun",
    "AuditLog",
    "Conversation",
    "Document",
    "DocumentChunk",
    "KnowledgeBase",
    "Message",
    "Notification",
    "Profile",
    "Project",
    "Workflow",
    "WorkflowRun",
]
