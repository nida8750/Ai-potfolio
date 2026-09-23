"""Chat orchestration: persist turns, run agents, stream safe status events."""

from __future__ import annotations

import time
from collections.abc import Iterator
from typing import Any

from app.services import agent_service, conversation_service, memory_service
from app.services.agent_service import AgentRunResult
from app.utils.errors import AgentExecutionError

_SAFE_EVENTS = frozenset(
    {
        "agent_selected",
        "searching_knowledge",
        "tool_running",
        "workflow_running",
        "generating_response",
        "completed",
        "error",
    }
)


def create_conversation_for_user(
    *,
    user_id: str,
    title: str | None = None,
    agent_slug: str | None = None,
) -> dict[str, Any]:
    agent_id = None
    if agent_slug:
        agent = agent_service.get_agent(agent_slug)
        agent_id = str(agent["id"])
    return conversation_service.create_conversation(
        user_id=user_id,
        title=title or "New conversation",
        agent_id=agent_id,
    )


def get_conversation_detail(*, conversation_id: str, user_id: str) -> dict[str, Any]:
    conversation = conversation_service.get_conversation(
        conversation_id=conversation_id, user_id=user_id
    )
    messages = conversation_service.list_messages(conversation_id=conversation_id, user_id=user_id)
    runs = conversation_service.list_agent_runs(conversation_id=conversation_id, user_id=user_id)
    return {
        "conversation": conversation,
        "messages": messages,
        "agent_runs": runs,
    }


def post_message(
    *,
    conversation_id: str,
    user_id: str,
    content: str,
    agent_id: str | None = None,
) -> dict[str, Any]:
    """Persist user message, run agent graph, persist assistant reply + run."""
    conversation = conversation_service.get_conversation(
        conversation_id=conversation_id, user_id=user_id
    )
    user_msg = conversation_service.add_message(
        conversation_id=conversation_id,
        user_id=user_id,
        role="USER",
        content=content,
    )

    memory = memory_service.build_memory_context(conversation_id=conversation_id, user_id=user_id)
    composed = memory_service.compose_agent_input(content, memory)

    target_agent = agent_id or conversation.get("agent_id") or "supervisor"
    started = time.perf_counter()
    try:
        run: AgentRunResult = agent_service.run_agent(
            str(target_agent),
            message=composed,
            user_id=user_id,
        )
        status = "failed" if run.error else "succeeded"
    except Exception as exc:  # noqa: BLE001
        elapsed = int((time.perf_counter() - started) * 1000)
        conversation_service.add_agent_run(
            conversation_id=conversation_id,
            user_id=user_id,
            agent_id=str(target_agent),
            status="failed",
            input_payload={"message": content[:2000]},
            execution_time_ms=elapsed,
            error="Agent execution failed.",
        )
        raise AgentExecutionError("Agent execution failed.") from exc

    elapsed = int((time.perf_counter() - started) * 1000)
    assistant_msg = conversation_service.add_message(
        conversation_id=conversation_id,
        user_id=user_id,
        role="ASSISTANT",
        content=run.final_response or "No response was produced.",
        metadata={
            "selected_agent": run.selected_agent,
            "status_events": [e for e in run.status_events if e in _SAFE_EVENTS],
            "run_id": run.run_id,
        },
    )
    agent_run = conversation_service.add_agent_run(
        conversation_id=conversation_id,
        user_id=user_id,
        agent_id=run.agent_id,
        status=status,
        input_payload={"message": content[:2000]},
        output_payload={
            "selected_agent": run.selected_agent,
            "status_events": [e for e in run.status_events if e in _SAFE_EVENTS],
            "final_response": run.final_response,
            # Omit raw tool payloads that might contain sensitive config.
            "tool_names": [c.get("tool") for c in run.tool_calls],
        },
        execution_time_ms=elapsed,
        error=run.error,
        metadata={"run_id": run.run_id},
    )

    return {
        "user_message": user_msg,
        "assistant_message": assistant_msg,
        "agent_run": agent_run,
        "selected_agent": run.selected_agent,
        "status_events": [e for e in run.status_events if e in _SAFE_EVENTS],
        "final_response": run.final_response,
    }


def stream_message_events(
    *,
    conversation_id: str,
    user_id: str,
    content: str,
    agent_id: str | None = None,
) -> Iterator[dict[str, Any]]:
    """Yield safe SSE payloads while running a chat turn."""
    try:
        # Emit early progress before the blocking graph run.
        yield {"event": "agent_selected", "data": {"status": "agent_selected"}}
        result = post_message(
            conversation_id=conversation_id,
            user_id=user_id,
            content=content,
            agent_id=agent_id,
        )
        for status in result.get("status_events") or []:
            if status in _SAFE_EVENTS and status not in {"completed", "error"}:
                yield {"event": status, "data": {"status": status}}
        yield {
            "event": "completed",
            "data": {
                "status": "completed",
                "selected_agent": result.get("selected_agent"),
                "final_response": result.get("final_response"),
                "assistant_message": result.get("assistant_message"),
                "user_message": result.get("user_message"),
                "agent_run_id": (result.get("agent_run") or {}).get("id"),
            },
        }
    except Exception:  # noqa: BLE001
        yield {
            "event": "error",
            "data": {
                "status": "error",
                "message": "The agent run failed. Please try again.",
            },
        }
