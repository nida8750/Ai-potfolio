from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.agents.llm import heuristic_route
from app.agents.tools.registry import invoke_tool, reset_registry_for_tests
from app.main import app
from app.services.auth_service import CurrentUser
from app.utils.errors import ValidationError

client = TestClient(app)
reset_registry_for_tests()


def _user() -> CurrentUser:
    return CurrentUser(
        id=uuid4(),
        email="agent@example.com",
        name="Agent User",
        role="USER",
        status="active",
    )


def test_supervisor_routing_keywords() -> None:
    assert heuristic_route("Run the invoiceflow n8n workflow")[0] == "automation"
    assert heuristic_route("Search my uploaded PDF knowledge base")[0] == "rag"
    assert heuristic_route("What is LangGraph?")[0] == "research"
    assert heuristic_route("hello")[0] == "support"


def test_blocked_tool_rejected() -> None:
    try:
        invoke_tool("shell", {}, agent="support")
        raise AssertionError("expected ValidationError")
    except ValidationError as exc:
        assert exc.code == "TOOL_NOT_ALLOWED"


def test_n8n_workflow_must_be_allowlisted() -> None:
    result = invoke_tool(
        "n8n_workflow_trigger",
        {"workflow": "rm_rf"},
        agent="automation",
    )
    inner = result.get("result") if isinstance(result.get("result"), dict) else result
    assert inner.get("ok") is False
    assert inner.get("error") == "workflow_not_allowed"


def test_agent_run_requires_auth() -> None:
    response = client.post("/api/v1/agents/support/run", json={"message": "hi"})
    assert response.status_code == 401


def test_agent_run_support() -> None:
    with patch("app.dependencies.validate_access_token", return_value=_user()):
        response = client.post(
            "/api/v1/agents/support/run",
            headers={"Authorization": "Bearer t"},
            json={"message": "What services do you offer?"},
        )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["selected_agent"] in {"support", "research", "rag", "automation"}
    assert "completed" in data["status_events"] or data["final_response"]
