"""Generic workflows API over the automation catalog."""

from __future__ import annotations

from fastapi import APIRouter

from app.dependencies import RequireUserDep
from app.schemas.automation import AutomationTriggerRequest
from app.schemas.common import ok
from app.services import automation_service
from app.utils.errors import NotFoundError

router = APIRouter(prefix="/workflows", tags=["workflows"])


@router.get("")
def list_workflows(_user: RequireUserDep) -> dict:
    return ok({"workflows": automation_service.list_automation_products()})


@router.post("/{workflow_id}/run")
def run_workflow(
    workflow_id: str,
    body: AutomationTriggerRequest,
    user: RequireUserDep,
) -> dict:
    products = automation_service.list_automation_products()
    match = next(
        (w for w in products if w["id"] == workflow_id or w["workflow_type"] == workflow_id),
        None,
    )
    if not match:
        raise NotFoundError("Workflow not found.")
    result = automation_service.trigger_automation(
        product=str(match["workflow_type"]),
        user_id=str(user.id),
        payload=body.payload,
        idempotency_key=body.idempotency_key,
    )
    return ok(result)


@router.get("/{workflow_id}/runs")
def list_workflow_runs(workflow_id: str, user: RequireUserDep) -> dict:
    products = automation_service.list_automation_products()
    match = next(
        (w for w in products if w["id"] == workflow_id or w["workflow_type"] == workflow_id),
        None,
    )
    if not match:
        raise NotFoundError("Workflow not found.")
    runs = [
        r
        for r in automation_service.list_runs_for_user(user_id=str(user.id))
        if r.get("workflow_id") == match["id"]
    ]
    return ok({"runs": runs})
