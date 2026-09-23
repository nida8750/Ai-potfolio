"""User notifications. Empty → []. Never invents rows."""

from __future__ import annotations

from typing import Any

from app.config import get_settings
from app.db.supabase import get_supabase_admin
from app.utils.errors import NotFoundError, ServiceUnavailableError


def list_notifications(user_id: str) -> list[dict[str, Any]]:
    settings = get_settings()
    if not settings.supabase_configured:
        return []
    result = (
        get_supabase_admin()
        .table("notifications")
        .select("id,user_id,type,title,message,read,metadata,created_at")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(100)
        .execute()
    )
    return [row for row in (result.data or []) if isinstance(row, dict)]


def mark_read(notification_id: str, user_id: str) -> dict[str, Any]:
    settings = get_settings()
    if not settings.supabase_configured:
        raise ServiceUnavailableError("Supabase is not configured.")
    existing = (
        get_supabase_admin()
        .table("notifications")
        .select("id,user_id")
        .eq("id", notification_id)
        .eq("user_id", user_id)
        .limit(1)
        .execute()
    )
    if not existing.data:
        raise NotFoundError("Notification not found.")
    updated = (
        get_supabase_admin()
        .table("notifications")
        .update({"read": True})
        .eq("id", notification_id)
        .eq("user_id", user_id)
        .execute()
    )
    rows = [row for row in (updated.data or []) if isinstance(row, dict)]
    if not rows:
        raise NotFoundError("Notification not found.")
    return rows[0]
