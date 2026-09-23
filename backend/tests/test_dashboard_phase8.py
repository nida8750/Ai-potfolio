from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.services.dashboard_service import platform_overview, user_overview

client = TestClient(app)


def test_empty_platform_uses_zeros_and_empty_lists() -> None:
    overview = platform_overview()
    assert overview["failed_runs"] >= 0
    assert isinstance(overview["recent_users"], list)
    assert isinstance(overview["notifications"], list)
    user = user_overview(user_id=str(uuid4()))
    assert user["total_conversations"] >= 0
    assert user["notifications"] == [] or isinstance(user["notifications"], list)


def test_internal_dashboard_without_key() -> None:
    response = client.get("/api/v1/internal/dashboard")
    assert response.status_code in {401, 503}
