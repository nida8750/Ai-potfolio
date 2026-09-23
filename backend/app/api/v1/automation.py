"""Business automation product endpoints (n8n-backed)."""

from __future__ import annotations

from fastapi import APIRouter, Request

from app.dependencies import RequireUserDep
from app.middleware.rate_limit import N8N_LIMIT, enforce_rate_limit
from app.schemas.automation import AutomationTriggerRequest
from app.schemas.common import ok
from app.services import automation_service

router = APIRouter(prefix="/automation", tags=["automation"])


def _trigger(
    product: str,
    body: AutomationTriggerRequest,
    user: RequireUserDep,
    request: Request,
) -> dict:
    enforce_rate_limit(
        request,
        scope=N8N_LIMIT.key,
        limit=N8N_LIMIT.limit,
        window_seconds=N8N_LIMIT.window_seconds,
    )
    result = automation_service.trigger_automation(
        product=product,
        user_id=str(user.id),
        payload=body.payload,
        idempotency_key=body.idempotency_key,
    )
    return ok(
        {
            "product": result["product"],
            "workflow_id": result["workflow_id"],
            "run": result["run"],
            "idempotent_replay": result["idempotent_replay"],
            "n8n_configured": result["n8n_configured"],
        }
    )


@router.get("/products")
def list_products(_user: RequireUserDep) -> dict:
    return ok({"products": automation_service.list_automation_products()})


@router.get("/runs")
def list_runs(user: RequireUserDep) -> dict:
    return ok({"runs": automation_service.list_runs_for_user(user_id=str(user.id))})


@router.post("/leadflow")
def leadflow(body: AutomationTriggerRequest, user: RequireUserDep, request: Request) -> dict:
    return _trigger("leadflow", body, user, request)


@router.post("/mailpilot")
def mailpilot(body: AutomationTriggerRequest, user: RequireUserDep, request: Request) -> dict:
    return _trigger("mailpilot", body, user, request)


@router.post("/invoiceflow")
def invoiceflow(body: AutomationTriggerRequest, user: RequireUserDep, request: Request) -> dict:
    return _trigger("invoiceflow", body, user, request)


@router.post("/supportsync")
def supportsync(body: AutomationTriggerRequest, user: RequireUserDep, request: Request) -> dict:
    return _trigger("supportsync", body, user, request)


@router.post("/contentflow")
def contentflow(body: AutomationTriggerRequest, user: RequireUserDep, request: Request) -> dict:
    return _trigger("contentflow", body, user, request)
