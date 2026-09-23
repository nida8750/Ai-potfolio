"""Published portfolio projects. Empty store → []. Never invents records."""

from __future__ import annotations

from typing import Any

from app.config import get_settings
from app.db.supabase import get_supabase_admin


def list_published_projects() -> list[dict[str, Any]]:
    settings = get_settings()
    if not settings.supabase_configured:
        return []
    try:
        result = (
            get_supabase_admin()
            .table("projects")
            .select(
                "id,title,slug,category,description,technologies,image,github_url,live_url,featured,is_published,sort_order,created_at,updated_at"
            )
            .eq("is_published", True)
            .order("sort_order")
            .execute()
        )
        return [row for row in (result.data or []) if isinstance(row, dict)]
    except Exception:  # noqa: BLE001
        return []
