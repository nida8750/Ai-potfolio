"""Thin repository base for Supabase table access."""

from __future__ import annotations

from typing import Any

from app.db.supabase import get_supabase_admin


class BaseRepository:
    table_name: str

    def __init__(self, client: Any | None = None) -> None:
        self._client = client

    @property
    def client(self) -> Any:
        return self._client or get_supabase_admin()

    @property
    def table(self) -> Any:
        return self.client.table(self.table_name)
