"""Public published projects — real rows only."""

from fastapi import APIRouter

from app.schemas.common import ok
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("")
def list_projects() -> dict:
    return ok({"projects": project_service.list_published_projects()})
