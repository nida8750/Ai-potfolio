"""Conversation / message persistence.

Uses Supabase when configured; otherwise an in-process store so Phase 5
works without inventing credentials. Never stores secrets, JWTs, or API keys.
"""

from __future__ import annotations

import threading
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from app.config import get_settings
from app.db.supabase import SupabaseNotConfiguredError, get_supabase_admin
from app.utils.errors import AuthorizationError, NotFoundError, ValidationError

_SENSITIVE_KEYS = frozenset(
    {
        "password",
        "api_key",
        "apikey",
        "access_token",
        "refresh_token",
        "jwt",
        "authorization",
        "n8n_webhook_secret",
        "service_role_key",
        "secret",
    }
)


def _utcnow() -> str:
    return datetime.now(UTC).isoformat()


def sanitize_metadata(meta: dict[str, Any] | None) -> dict[str, Any]:
    if not meta:
        return {}
    clean: dict[str, Any] = {}
    for key, value in meta.items():
        lower = str(key).lower()
        if lower in _SENSITIVE_KEYS or any(s in lower for s in _SENSITIVE_KEYS):
            continue
        if isinstance(value, dict):
            clean[key] = sanitize_metadata(value)
        else:
            clean[key] = value
    return clean


class _MemoryStore:
    """Thread-safe in-memory fallback when Supabase is not configured."""

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.conversations: dict[str, dict[str, Any]] = {}
        self.messages: dict[str, list[dict[str, Any]]] = {}
        self.agent_runs: dict[str, list[dict[str, Any]]] = {}

    def clear(self) -> None:
        with self._lock:
            self.conversations.clear()
            self.messages.clear()
            self.agent_runs.clear()


_STORE = _MemoryStore()


def reset_memory_store() -> None:
    _STORE.clear()


def _use_supabase() -> bool:
    return get_settings().supabase_configured


def create_conversation(
    *,
    user_id: str,
    title: str = "New conversation",
    agent_id: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    now = _utcnow()
    row = {
        "id": str(uuid4()),
        "user_id": user_id,
        "agent_id": agent_id,
        "title": (title or "New conversation").strip()[:200],
        "status": "active",
        "metadata": sanitize_metadata(metadata),
        "created_at": now,
        "updated_at": now,
    }
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = admin.table("conversations").insert(row).execute()
            data = (result.data or [row])[0]
            return data
        except SupabaseNotConfiguredError:
            pass
        except Exception:
            # Fall through to memory so local/dev still works.
            pass

    with _STORE._lock:
        _STORE.conversations[row["id"]] = row
        _STORE.messages[row["id"]] = []
        _STORE.agent_runs[row["id"]] = []
    return deepcopy(row)


def list_conversations(*, user_id: str) -> list[dict[str, Any]]:
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("conversations")
                .select("*")
                .eq("user_id", user_id)
                .neq("status", "deleted")
                .order("updated_at", desc=True)
                .execute()
            )
            return list(result.data or [])
        except Exception:
            pass

    with _STORE._lock:
        rows = [
            deepcopy(c)
            for c in _STORE.conversations.values()
            if c["user_id"] == user_id and c.get("status") != "deleted"
        ]
    rows.sort(key=lambda r: r.get("updated_at") or "", reverse=True)
    return rows


def get_conversation(*, conversation_id: str, user_id: str) -> dict[str, Any]:
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("conversations")
                .select("*")
                .eq("id", conversation_id)
                .limit(1)
                .execute()
            )
            rows = result.data or []
            if not rows:
                raise NotFoundError("Conversation not found.")
            row = rows[0]
            if str(row.get("user_id")) != user_id:
                raise AuthorizationError("Not your conversation.")
            return row
        except (NotFoundError, AuthorizationError):
            raise
        except Exception:
            pass

    with _STORE._lock:
        row = _STORE.conversations.get(conversation_id)
        if not row or row.get("status") == "deleted":
            raise NotFoundError("Conversation not found.")
        if row["user_id"] != user_id:
            raise AuthorizationError("Not your conversation.")
        return deepcopy(row)


def delete_conversation(*, conversation_id: str, user_id: str) -> None:
    get_conversation(conversation_id=conversation_id, user_id=user_id)
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            admin.table("conversations").update({"status": "archived", "updated_at": _utcnow()}).eq(
                "id", conversation_id
            ).eq("user_id", user_id).execute()
            return
        except Exception:
            pass

    with _STORE._lock:
        row = _STORE.conversations.get(conversation_id)
        if row:
            row["status"] = "deleted"
            row["updated_at"] = _utcnow()


def add_message(
    *,
    conversation_id: str,
    user_id: str,
    role: str,
    content: str,
    metadata: dict[str, Any] | None = None,
    token_usage: dict[str, Any] | None = None,
) -> dict[str, Any]:
    get_conversation(conversation_id=conversation_id, user_id=user_id)
    if role not in {"USER", "ASSISTANT", "SYSTEM", "TOOL"}:
        raise ValidationError("Invalid message role.")
    text = (content or "").strip()
    if not text:
        raise ValidationError("message content is required.")

    row = {
        "id": str(uuid4()),
        "conversation_id": conversation_id,
        "role": role,
        "content": text[:50000],
        "metadata": sanitize_metadata(metadata),
        "token_usage": token_usage,
        "created_at": _utcnow(),
    }

    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = admin.table("messages").insert(row).execute()
            admin.table("conversations").update({"updated_at": _utcnow()}).eq(
                "id", conversation_id
            ).execute()
            return (result.data or [row])[0]
        except Exception:
            pass

    with _STORE._lock:
        _STORE.messages.setdefault(conversation_id, []).append(row)
        conv = _STORE.conversations.get(conversation_id)
        if conv:
            conv["updated_at"] = _utcnow()
            if role == "USER" and conv.get("title") in {None, "", "New conversation"}:
                conv["title"] = text[:80]
    return deepcopy(row)


def list_messages(*, conversation_id: str, user_id: str) -> list[dict[str, Any]]:
    get_conversation(conversation_id=conversation_id, user_id=user_id)
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("messages")
                .select("*")
                .eq("conversation_id", conversation_id)
                .order("created_at")
                .execute()
            )
            return list(result.data or [])
        except Exception:
            pass

    with _STORE._lock:
        return deepcopy(_STORE.messages.get(conversation_id, []))


def add_agent_run(
    *,
    conversation_id: str,
    user_id: str,
    agent_id: str | None,
    status: str,
    input_payload: dict[str, Any],
    output_payload: dict[str, Any] | None = None,
    execution_time_ms: int | None = None,
    error: str | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    get_conversation(conversation_id=conversation_id, user_id=user_id)
    now = _utcnow()
    row = {
        "id": str(uuid4()),
        "conversation_id": conversation_id,
        "agent_id": agent_id,
        "status": status,
        "input": sanitize_metadata(input_payload),
        "output": sanitize_metadata(output_payload) if output_payload else None,
        "execution_time_ms": execution_time_ms,
        "error": error,
        "metadata": sanitize_metadata(metadata),
        "created_at": now,
        "completed_at": now if status in {"succeeded", "failed", "cancelled"} else None,
    }
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = admin.table("agent_runs").insert(row).execute()
            return (result.data or [row])[0]
        except Exception:
            pass

    with _STORE._lock:
        _STORE.agent_runs.setdefault(conversation_id, []).append(row)
    return deepcopy(row)


def list_agent_runs(*, conversation_id: str, user_id: str) -> list[dict[str, Any]]:
    get_conversation(conversation_id=conversation_id, user_id=user_id)
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("agent_runs")
                .select("*")
                .eq("conversation_id", conversation_id)
                .order("created_at", desc=True)
                .execute()
            )
            return list(result.data or [])
        except Exception:
            pass

    with _STORE._lock:
        return deepcopy(_STORE.agent_runs.get(conversation_id, []))
