"""Supabase client factory and connectivity checks.

Never invent credentials. When keys are missing, clients are unavailable and
health reports not_configured. Service-role clients must stay server-side only.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from app.config import Settings, get_settings, is_configured

try:
    from supabase import Client, create_client
except ImportError:  # pragma: no cover - install via requirements.txt
    Client = Any  # type: ignore[misc, assignment]
    create_client = None  # type: ignore[assignment]


class SupabaseNotConfiguredError(RuntimeError):
    """Raised when Supabase env vars are missing or still placeholders."""


@dataclass(frozen=True, slots=True)
class SupabaseConnectivity:
    """Safe connectivity result — no secrets, no key material."""

    configured: bool
    reachable: bool | None
    detail: str


_admin_client: Client | None = None
_anon_client: Client | None = None


def _require_create_client() -> Any:
    if create_client is None:
        raise RuntimeError(
            "supabase package is not installed. Run: pip install -r requirements.txt"
        )
    return create_client


def _build_client(url: str, key: str) -> Client:
    factory = _require_create_client()
    # supabase-py defaults are fine for a short-lived server client.
    return factory(url, key)


def get_supabase_admin(settings: Settings | None = None) -> Client:
    """Service-role client. Bypasses RLS. Server-only. Never expose to browsers."""
    global _admin_client
    cfg = settings or get_settings()
    if not cfg.supabase_configured:
        raise SupabaseNotConfiguredError(
            "Supabase is not configured. Set SUPABASE_URL, SUPABASE_ANON_KEY, "
            "and SUPABASE_SERVICE_ROLE_KEY."
        )
    if cfg.supabase_service_role_key.strip() == cfg.supabase_anon_key.strip():
        raise SupabaseNotConfiguredError(
            "SUPABASE_SERVICE_ROLE_KEY must not be the same as SUPABASE_ANON_KEY."
        )
    if settings is not None:
        return _build_client(cfg.supabase_url, cfg.supabase_service_role_key)
    if _admin_client is None:
        _admin_client = _build_client(cfg.supabase_url, cfg.supabase_service_role_key)
    return _admin_client


def get_supabase_anon(settings: Settings | None = None) -> Client:
    """Anon-key client for user-scoped JWT operations (Phase 3+)."""
    global _anon_client
    cfg = settings or get_settings()
    if not (is_configured(cfg.supabase_url) and is_configured(cfg.supabase_anon_key)):
        raise SupabaseNotConfiguredError(
            "Supabase anon client requires SUPABASE_URL and SUPABASE_ANON_KEY."
        )
    if settings is not None:
        return _build_client(cfg.supabase_url, cfg.supabase_anon_key)
    if _anon_client is None:
        _anon_client = _build_client(cfg.supabase_url, cfg.supabase_anon_key)
    return _anon_client


def check_supabase_connectivity(settings: Settings | None = None) -> SupabaseConnectivity:
    """Probe Supabase when configured. Returns safe status strings only."""
    cfg = settings or get_settings()
    if not cfg.supabase_configured:
        return SupabaseConnectivity(
            configured=False,
            reachable=None,
            detail="not_configured",
        )

    try:
        client = get_supabase_admin(cfg)
        # Lightweight PostgREST call. Empty tables yield []. Missing tables
        # still prove the API is reachable (we treat that as connected).
        client.table("profiles").select("id").limit(1).execute()
        return SupabaseConnectivity(
            configured=True,
            reachable=True,
            detail="ok",
        )
    except SupabaseNotConfiguredError as exc:
        return SupabaseConnectivity(
            configured=False,
            reachable=None,
            detail=str(exc),
        )
    except Exception as exc:  # noqa: BLE001 — health must never raise
        # PostgREST 404/PGRST205 = project reachable but table missing (migrations pending)
        message = str(exc).lower()
        if "pgrst" in message or "does not exist" in message or "42p01" in message:
            return SupabaseConnectivity(
                configured=True,
                reachable=True,
                detail="reachable_migrations_pending",
            )
        return SupabaseConnectivity(
            configured=True,
            reachable=False,
            detail="unreachable",
        )


def clear_supabase_clients() -> None:
    """Clear cached clients (useful in tests after env changes)."""
    global _admin_client, _anon_client
    _admin_client = None
    _anon_client = None
