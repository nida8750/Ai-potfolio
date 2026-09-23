"""Agents API — catalog + LangGraph run."""

from __future__ import annotations

from fastapi import APIRouter, Request

from app.dependencies import RequireUserDep
from app.middleware.rate_limit import AGENT_LIMIT, enforce_rate_limit
from app.schemas.agents import AgentRunRequest, AgentRunResponseData, AgentSummary
from app.schemas.common import ok
from app.services import agent_service

router = APIRouter(prefix="/agents", tags=["agents"])


@router.get("")
def list_agents(_user: RequireUserDep) -> dict:
    agents = [AgentSummary(**a).model_dump(mode="json") for a in agent_service.list_agents()]
    return ok({"agents": agents, "tools": agent_service.tools_catalog()})


@router.get("/{agent_id}")
def get_agent(agent_id: str, _user: RequireUserDep) -> dict:
    agent = agent_service.get_agent(agent_id)
    return ok(AgentSummary(**agent).model_dump(mode="json"))


@router.post("/{agent_id}/run")
def run_agent(
    agent_id: str,
    body: AgentRunRequest,
    user: RequireUserDep,
    request: Request,
) -> dict:
    enforce_rate_limit(
        request,
        scope=AGENT_LIMIT.key,
        limit=AGENT_LIMIT.limit,
        window_seconds=AGENT_LIMIT.window_seconds,
    )
    result = agent_service.run_agent(
        agent_id,
        message=body.message,
        user_id=str(user.id),
    )
    data = AgentRunResponseData(
        run_id=result.run_id,
        agent_id=result.agent_id,
        selected_agent=result.selected_agent,
        status_events=result.status_events,
        final_response=result.final_response,
        tool_calls=result.tool_calls,
        error=result.error,
    )
    return ok(data.model_dump(mode="json"))
