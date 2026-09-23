from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.main import app
from app.middleware.rate_limit import reset_rate_limiter
from app.services.automation_service import reset_automation_store
from app.services.conversation_service import reset_memory_store
from app.services.rag_service import reset_rag_store


@pytest.fixture(autouse=True)
def isolate_external_services(monkeypatch: pytest.MonkeyPatch) -> None:
    """Keep tests off live Supabase / n8n / LLM / internal keys from a local .env."""
    for key in (
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "LLM_API_KEY",
        "N8N_WEBHOOK_BASE_URL",
        "N8N_WEBHOOK_SECRET",
        "INTERNAL_API_KEY",
    ):
        monkeypatch.setenv(key, "")
    get_settings.cache_clear()
    isolated = get_settings()
    monkeypatch.setattr("app.config.settings", isolated)
    monkeypatch.setattr("app.api.v1.health.settings", isolated)
    yield
    get_settings.cache_clear()


@pytest.fixture
def client() -> TestClient:
    reset_rate_limiter()
    reset_automation_store()
    reset_memory_store()
    reset_rag_store()
    return TestClient(app)
