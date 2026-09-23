"""Authenticated notifications."""

from fastapi import APIRouter

from app.dependencies import RequireUserDep
from app.schemas.common import ok
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("")
def list_notifications(user: RequireUserDep) -> dict:
    return ok({"notifications": notification_service.list_notifications(str(user.id))})


@router.patch("/{notification_id}/read")
def mark_notification_read(notification_id: str, user: RequireUserDep) -> dict:
    row = notification_service.mark_read(notification_id, str(user.id))
    return ok(row)
