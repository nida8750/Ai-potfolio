"""Dashboard / admin overview APIs — real counts only."""

from __future__ import annotations

import hmac

from fastapi import APIRouter, Header, HTTPException, status

from app.config import get_settings, is_configured
from app.dependencies import RequireAdminDep, RequireUserDep
from app.schemas.agents import AgentSummary
from app.schemas.common import ok
from app.services import agent_service, dashboard_service

router = APIRouter(tags=["dashboard"])


def _require_internal_key(x_internal_key: str | None) -> None:
    settings = get_settings()
    expected = settings.internal_api_key
    if not is_configured(expected):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "code": "SERVICE_UNAVAILABLE",
                "message": "INTERNAL_API_KEY is not configured.",
            },
        )
    if not x_internal_key or not hmac.compare_digest(expected, x_internal_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"code": "UNAUTHENTICATED", "message": "Invalid internal key."},
        )


@router.get("/dashboard/overview")
def user_dashboard(user: RequireUserDep) -> dict:
    """Current user's AI platform stats (0 / [] when empty)."""
    return ok(dashboard_service.user_overview(user_id=str(user.id)))


@router.get("/admin/dashboard")
def admin_dashboard(_admin: RequireAdminDep) -> dict:
    """Platform-wide AI stats for admins."""
    return ok(dashboard_service.platform_overview())


@router.get("/internal/dashboard")
def internal_dashboard(
    x_internal_key: str | None = Header(default=None, alias="X-Internal-Key"),
) -> dict:
    """
    Server-to-server overview for the Next.js admin BFF.
    Requires INTERNAL_API_KEY. Never expose this key to browsers.
    """
    _require_internal_key(x_internal_key)
    return ok(dashboard_service.platform_overview())


@router.get("/internal/agents")
def internal_agents(
    x_internal_key: str | None = Header(default=None, alias="X-Internal-Key"),
) -> dict:
    """Server-to-server agent catalog for the Next.js admin BFF."""
    _require_internal_key(x_internal_key)
    agents = [AgentSummary(**a).model_dump(mode="json") for a in agent_service.list_agents()]
    return ok({"agents": agents, "tools": agent_service.tools_catalog()})
