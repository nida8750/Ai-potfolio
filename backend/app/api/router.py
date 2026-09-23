"""Aggregate v1 routers."""

from fastapi import APIRouter

from app.api.v1 import (
    agents,
    auth,
    automation,
    conversations,
    dashboard,
    files,
    health,
    knowledge,
    notifications,
    projects,
    users,
    workflows,
)

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(agents.router)
api_router.include_router(conversations.router)
api_router.include_router(knowledge.router)
api_router.include_router(files.router)
api_router.include_router(automation.router)
api_router.include_router(workflows.router)
api_router.include_router(projects.router)
api_router.include_router(notifications.router)
api_router.include_router(dashboard.router)
