from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import CurrentUser
from app.services.conversation_service import reset_memory_store

client = TestClient(app)


def _user() -> CurrentUser:
    return CurrentUser(
        id=uuid4(),
        email="chat@example.com",
        name="Chat User",
        role="USER",
        status="active",
    )


def setup_function() -> None:
    reset_memory_store()


def test_conversations_require_auth() -> None:
    assert client.get("/api/v1/conversations").status_code == 401


def test_create_conversation_and_message() -> None:
    user = _user()
    with patch("app.dependencies.validate_access_token", return_value=user):
        created = client.post(
            "/api/v1/conversations",
            headers={"Authorization": "Bearer t"},
            json={"title": "Hello"},
        )
        assert created.status_code == 200
        conversation_id = created.json()["data"]["id"]
        posted = client.post(
            f"/api/v1/conversations/{conversation_id}/messages",
            headers={"Authorization": "Bearer t"},
            json={"content": "Hi there", "stream": False},
        )
    assert posted.status_code == 200
    body = posted.json()["data"]
    assistant = body.get("assistant_message") or body.get("assistant")
    user_msg = body.get("user_message") or body.get("user")
    assert assistant["content"]
    assert user_msg["role"] == "USER"
