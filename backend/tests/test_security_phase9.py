import pytest

from app.utils.errors import ValidationError
from app.utils.security import (
    assert_n8n_base_url,
    assert_safe_external_url,
    redact_for_logs,
    sniff_upload,
)


def test_n8n_url_production_requires_https() -> None:
    with pytest.raises(ValidationError):
        assert_n8n_base_url("http://n8n.example.com/webhook", app_env="production")
    assert assert_n8n_base_url("https://n8n.example.com/webhook", app_env="production").startswith(
        "https://"
    )


def test_ssrf_blocks_private_hosts() -> None:
    with pytest.raises(ValidationError):
        assert_safe_external_url("http://127.0.0.1/secret", require_https=False)
    with pytest.raises(ValidationError):
        assert_safe_external_url("https://169.254.169.254/latest/meta-data")


def test_logs_redact_secrets() -> None:
    text = redact_for_logs("Authorization Bearer abc.def and n8n_webhook_secret=xyz")
    assert "abc.def" not in text
    assert "[REDACTED]" in text


def test_upload_sniff_rejects_spoofed_pdf() -> None:
    with pytest.raises(ValidationError):
        sniff_upload("file.pdf", b"not-a-pdf")
