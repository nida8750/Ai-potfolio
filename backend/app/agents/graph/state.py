"""Typed LangGraph state for platform + client-assistant flows."""

from __future__ import annotations

from typing import Annotated, Literal, TypedDict

from langgraph.graph.message import add_messages

AgentName = Literal[
    "supervisor",
    "research",
    "rag",
    "automation",
    "support",
    "voice",
    "validator",
]

AgentRoute = Literal["research", "rag", "automation", "support"]

ClientIntent = Literal[
    "portfolio",
    "service",
    "project",
    "technical",
    "hiring",
    "contact",
    "automation",
    "rag",
    "unknown",
]

FlowStatus = Literal["ok", "blocked", "error", "awaiting_user", "lead_pending"]


class RetrievedContext(TypedDict, total=False):
    source: str
    content: str
    score: float
    document_id: str


class ToolCallRecord(TypedDict, total=False):
    tool: str
    arguments: dict[str, str]


class ToolResultRecord(TypedDict, total=False):
    tool: str
    ok: bool
    result: dict[str, object]


class LeadDraft(TypedDict, total=False):
    name: str
    email: str
    company: str
    project_type: str
    problem: str
    requirements: str
    conversation_id: str
    confirmed: bool
    persisted: bool


class AgentState(TypedDict, total=False):
    """Shared graph state. Never store secrets, JWTs, or API keys here."""

    messages: Annotated[list[object], add_messages]
    user_id: str | None
    conversation_id: str | None
    input: str
    input_text: str
    intent: ClientIntent | None
    selected_agent: AgentRoute | None
    route_reason: str | None
    status_events: list[str]
    tool_calls: list[ToolCallRecord]
    tool_results: list[ToolResultRecord]
    retrieved_context: list[RetrievedContext]
    specialist_output: str | None
    lead_data: LeadDraft | None
    response: str | None
    final_response: str | None
    status: FlowStatus
    error: str | None
    metadata: dict[str, str]


def empty_state(
    user_input: str,
    *,
    user_id: str | None = None,
    conversation_id: str | None = None,
) -> AgentState:
    text = (user_input or "").strip()
    return {
        "messages": [],
        "user_id": user_id,
        "conversation_id": conversation_id,
        "input": text,
        "input_text": text,
        "intent": None,
        "selected_agent": None,
        "route_reason": None,
        "status_events": [],
        "tool_calls": [],
        "tool_results": [],
        "retrieved_context": [],
        "specialist_output": None,
        "lead_data": None,
        "response": None,
        "final_response": None,
        "status": "ok",
        "error": None,
        "metadata": {},
    }
