"""Environment-based settings. Empty values mean a service is not configured yet."""

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_PLACEHOLDER_MARKERS = (
    "",
    "changeme",
    "placeholder",
    "todo",
    "xxx",
    "replace-me",
    "replace_me",
    "your-password",
    "your_password",
    "[your-password]",
    "[YOUR-PASSWORD]",
)


def is_configured(value: str | None) -> bool:
    """True only when a real non-placeholder credential is present."""
    if value is None:
        return False
    trimmed = value.strip()
    if not trimmed:
        return False
    return trimmed.lower() not in _PLACEHOLDER_MARKERS


def is_supabase_api_url(value: str | None) -> bool:
    """True only for an HTTPS Supabase API URL (not a Postgres connection string)."""
    if not is_configured(value):
        return False
    trimmed = (value or "").strip().lower()
    if trimmed.startswith(("postgresql://", "postgres://")):
        return False
    return trimmed.startswith("https://")


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    app_name: str = "Nida AI Backend"
    app_env: str = "development"
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    frontend_url: str = Field(default="http://localhost:43127")

    @property
    def cors_origins(self) -> list[str]:
        """Comma-separated FRONTEND_URL plus the live and local Next.js origins."""
        seen: list[str] = []
        extras = (
            "http://localhost:43127",
            "http://127.0.0.1:43127",
            "https://ai-potfolio-khaki.vercel.app",
        )
        for raw in (*self.frontend_url.split(","), *extras):
            origin = raw.strip().rstrip("/")
            if origin and origin not in seen:
                seen.append(origin)
        return seen

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    llm_api_key: str = ""
    llm_model: str = ""

    n8n_webhook_base_url: str = ""
    n8n_webhook_secret: str = ""

    # Optional server-to-server key for Next.js → FastAPI dashboard BFF.
    # Never expose via NEXT_PUBLIC_*.
    internal_api_key: str = ""

    @property
    def supabase_configured(self) -> bool:
        return (
            is_supabase_api_url(self.supabase_url)
            and is_configured(self.supabase_anon_key)
            and is_configured(self.supabase_service_role_key)
        )

    @property
    def llm_configured(self) -> bool:
        return is_configured(self.llm_api_key)

    @property
    def n8n_configured(self) -> bool:
        return is_configured(self.n8n_webhook_base_url) and is_configured(self.n8n_webhook_secret)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
