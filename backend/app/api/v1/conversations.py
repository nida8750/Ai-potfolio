"""Conversations + messages API with optional SSE streaming."""

from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.dependencies import RequireUserDep
from app.middleware.rate_limit import CHAT_LIMIT, enforce_rate_limit
from app.schemas.common import ok
from app.schemas.conversations import CreateConversationRequest, PostMessageRequest
from app.services import chat_service, conversation_service

router = APIRouter(prefix="/conversations", tags=["conversations"])


def _sse(event: str, data: dict[str, Any]) -> str:
    payload = json.dumps(data, default=str)
    return f"event: {event}\ndata: {payload}\n\n"


@router.get("")
def list_conversations(user: RequireUserDep) -> dict:
    rows = conversation_service.list_conversations(user_id=str(user.id))
    return ok({"conversations": rows})


@router.post("")
def create_conversation(body: CreateConversationRequest, user: RequireUserDep) -> dict:
    row = chat_service.create_conversation_for_user(
        user_id=str(user.id),
        title=body.title,
        agent_slug=body.agent_id,
    )
    return ok(row)


@router.get("/{conversation_id}")
def get_conversation(conversation_id: str, user: RequireUserDep) -> dict:
    detail = chat_service.get_conversation_detail(
        conversation_id=conversation_id, user_id=str(user.id)
    )
    return ok(detail)


@router.delete("/{conversation_id}")
def delete_conversation(conversation_id: str, user: RequireUserDep) -> dict:
    conversation_service.delete_conversation(conversation_id=conversation_id, user_id=str(user.id))
    return ok({"deleted": True, "id": conversation_id})


@router.post("/{conversation_id}/messages")
def post_message(
    conversation_id: str,
    body: PostMessageRequest,
    user: RequireUserDep,
    request: Request,
):
    enforce_rate_limit(
        request,
        scope=CHAT_LIMIT.key,
        limit=CHAT_LIMIT.limit,
        window_seconds=CHAT_LIMIT.window_seconds,
    )
    if body.stream:

        def event_stream():
            for item in chat_service.stream_message_events(
                conversation_id=conversation_id,
                user_id=str(user.id),
                content=body.content,
                agent_id=body.agent_id,
            ):
                yield _sse(item["event"], item["data"])

        return StreamingResponse(
            event_stream(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )

    result = chat_service.post_message(
        conversation_id=conversation_id,
        user_id=str(user.id),
        content=body.content,
        agent_id=body.agent_id,
    )
    return ok(result)
