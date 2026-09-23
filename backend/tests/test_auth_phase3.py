from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import CurrentUser
from app.utils.errors import AuthenticationError

client = TestClient(app)


def test_me_requires_auth() -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_me_rejects_invalid_token() -> None:
    with patch(
        "app.dependencies.validate_access_token",
        side_effect=AuthenticationError("Invalid or expired session.", code="INVALID_TOKEN"),
    ):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer not-a-real-token"},
        )
    assert response.status_code == 401


def test_admin_dashboard_forbidden_for_user() -> None:
    user = CurrentUser(
        id=uuid4(),
        email="user@example.com",
        name="User",
        role="USER",
        status="active",
    )
    with patch("app.dependencies.validate_access_token", return_value=user):
        response = client.get(
            "/api/v1/admin/dashboard",
            headers={"Authorization": "Bearer t"},
        )
    assert response.status_code == 403


def test_admin_dashboard_ok_for_admin() -> None:
    admin = CurrentUser(
        id=uuid4(),
        email="admin@example.com",
        name="Admin",
        role="ADMIN",
        status="active",
    )
    with patch("app.dependencies.validate_access_token", return_value=admin):
        response = client.get(
            "/api/v1/admin/dashboard",
            headers={"Authorization": "Bearer t"},
        )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["total_agents"] >= 0
    assert data["recent_agent_activity"] == [] or isinstance(data["recent_agent_activity"], list)
