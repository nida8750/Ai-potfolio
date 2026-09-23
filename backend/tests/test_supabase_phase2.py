from app.config import Settings, is_supabase_api_url
from app.db.supabase import check_supabase_connectivity


def test_postgres_url_is_not_a_supabase_api_url() -> None:
    assert is_supabase_api_url("postgresql://postgres:x@db.example.com:5432/postgres") is False
    assert is_supabase_api_url("https://example.supabase.co") is True


def test_connectivity_not_configured_without_keys() -> None:
    settings = Settings(supabase_url="", supabase_anon_key="", supabase_service_role_key="")
    result = check_supabase_connectivity(settings)
    assert result.configured is False
    assert result.detail == "not_configured"
