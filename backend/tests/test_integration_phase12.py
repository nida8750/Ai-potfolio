from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_and_integration_have_no_secrets() -> None:
    health = client.get("/health")
    assert health.status_code == 200
    payload = health.json()["data"]
    blob = str(payload).lower()
    assert "service_role" not in blob
    assert "eyj" not in blob
    assert payload["checks"]["fastapi"] == "ok"
    integration = client.get("/api/v1/integration")
    assert integration.status_code == 200
    names = [layer["name"] for layer in integration.json()["data"]["layers"]]
    assert "fastapi" in names
    assert "n8n" in names
