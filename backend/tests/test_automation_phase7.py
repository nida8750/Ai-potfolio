from unittest.mock import MagicMock, patch
from uuid import uuid4

import httpx
import pytest
from fastapi.testclient import TestClient

from app.config import Settings
from app.main import app
from app.services import automation_service
from app.services.auth_service import CurrentUser
from app.services.automation_service import reset_automation_store
from app.services.n8n_signature import sign_n8n_payload, verify_n8n_signature
from app.utils.errors import ValidationError, WorkflowExecutionError

client = TestClient(app)


def _user() -> CurrentUser:
    return CurrentUser(
        id=uuid4(),
        email="auto@example.com",
        name="Auto User",
        role="USER",
        status="active",
    )


def setup_function() -> None:
    reset_automation_store()


def test_signature_roundtrip() -> None:
    secret = "test-secret"
    body = '{"event":"automation.leadflow"}'
    ts = "1710000000000"
    sig = sign_n8n_payload(secret, body, ts)
    assert verify_n8n_signature(secret, body, ts, sig, now_ms=1710000000000)
    assert not verify_n8n_signature(secret, body, ts, "deadbeef", now_ms=1710000000000)


def test_trigger_without_n8n_is_skipped() -> None:
    result = automation_service.trigger_automation(
        product="leadflow",
        user_id=str(uuid4()),
        payload={"email": "lead@example.com", "password": "nope"},
    )
    assert result["n8n_configured"] is False
    assert result["run"]["output"]["status"] == "skipped"
    assert "password" not in result["run"]["input"]


def test_idempotency_replays_same_run() -> None:
    uid = str(uuid4())
    first = automation_service.trigger_automation(
        product="mailpilot",
        user_id=uid,
        payload={"subject": "Hello"},
        idempotency_key="mail-1",
    )
    second = automation_service.trigger_automation(
        product="mailpilot",
        user_id=uid,
        payload={"subject": "Hello again"},
        idempotency_key="mail-1",
    )
    assert second["idempotent_replay"] is True
    assert second["run"]["id"] == first["run"]["id"]


def test_unknown_product_rejected() -> None:
    with pytest.raises(ValidationError):
        automation_service.trigger_automation(product="rm_rf", user_id=str(uuid4()), payload={})


def test_valid_n8n_request_succeeds() -> None:
    settings = Settings(
        n8n_webhook_base_url="https://n8n.example.com/webhook",
        n8n_webhook_secret="super-secret",
    )
    mock_response = MagicMock()
    mock_response.status_code = 200
    with patch("app.services.automation_service.httpx.Client") as client_cls:
        instance = client_cls.return_value.__enter__.return_value
        instance.post.return_value = mock_response
        result = automation_service.trigger_automation(
            product="invoiceflow",
            user_id=str(uuid4()),
            payload={"invoice_id": "inv-1"},
            settings=settings,
        )
    assert result["n8n_configured"] is True
    assert result["run"]["output"]["status"] == "sent"
    assert client_cls.return_value.__enter__.return_value.post.call_args.args[0].endswith(
        "/nida-ai/invoiceflow"
    )


def test_n8n_timeout_retries_then_fails() -> None:
    settings = Settings(
        n8n_webhook_base_url="https://n8n.example.com/webhook",
        n8n_webhook_secret="super-secret",
    )
    with (
        patch("app.services.automation_service.httpx.Client") as client_cls,
        patch("app.services.automation_service.time.sleep"),
    ):
        instance = client_cls.return_value.__enter__.return_value
        instance.post.side_effect = httpx.TimeoutException("timeout")
        with pytest.raises(WorkflowExecutionError):
            automation_service.trigger_automation(
                product="supportsync",
                user_id=str(uuid4()),
                payload={"ticket": "t-1"},
                settings=settings,
            )
        assert instance.post.call_count == 3


def test_http_requires_auth() -> None:
    assert client.post("/api/v1/automation/leadflow", json={"payload": {}}).status_code == 401


def test_http_leadflow_skipped_without_n8n() -> None:
    with patch("app.dependencies.validate_access_token", return_value=_user()):
        response = client.post(
            "/api/v1/automation/leadflow",
            headers={"Authorization": "Bearer t"},
            json={"payload": {"email": "a@b.com", "name": "Ada"}},
        )
    assert response.status_code == 200
    assert response.json()["data"]["n8n_configured"] is False
