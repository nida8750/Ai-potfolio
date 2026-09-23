from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import CurrentUser

client = TestClient(app)


def test_projects_public_empty_when_unconfigured() -> None:
    response = client.get("/api/v1/projects")
    assert response.status_code == 200
    assert response.json()["data"]["projects"] == []


def test_notifications_require_auth() -> None:
    assert client.get("/api/v1/notifications").status_code == 401


def test_users_me_requires_auth() -> None:
    assert client.get("/api/v1/users/me").status_code == 401


def test_users_me_ok() -> None:
    user = CurrentUser(
        id=uuid4(),
        email="me@example.com",
        name="Me",
        role="USER",
        status="active",
    )
    with patch("app.dependencies.validate_access_token", return_value=user):
        response = client.get("/api/v1/users/me", headers={"Authorization": "Bearer t"})
    assert response.status_code == 200
    assert response.json()["data"]["email"] == "me@example.com"
