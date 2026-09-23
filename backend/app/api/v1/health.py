"""Health + Phase 12 integration status endpoints."""

from fastapi import APIRouter

from app import __version__
from app.config import settings
from app.db.supabase import check_supabase_connectivity
from app.schemas.common import ok
from app.services.integration_service import build_integration_status

router = APIRouter(tags=["health"])


def _check_status(configured: bool) -> str:
    return "configured" if configured else "not_configured"


def _supabase_health() -> str:
    result = check_supabase_connectivity(settings)
    if not result.configured:
        # Distinguish empty vs wrong URL shape without leaking secrets.
        from app.config import is_configured, is_supabase_api_url

        if is_configured(settings.supabase_url) and not is_supabase_api_url(settings.supabase_url):
            return "misconfigured"
        return "not_configured"
    if result.reachable is True:
        return result.detail
    return "unreachable"


def health_payload() -> dict:
    return {
        "ok": True,
        "service": "nida-ai-backend",
        "version": __version__,
        "phase": 12,
        "checks": {
            "fastapi": "ok",
            "supabase": _supabase_health(),
            "llm": _check_status(settings.llm_configured),
            "n8n": _check_status(settings.n8n_configured),
        },
    }


@router.get("/health")
def health_v1() -> dict:
    return ok(health_payload())


@router.get("/integration")
def integration_status() -> dict:
    """Full stack wiring status for Phase 12 final integration."""
    return ok(build_integration_status())
