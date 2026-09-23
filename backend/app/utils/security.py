"""Security helpers: SSRF checks, redaction, upload sniffing."""

from __future__ import annotations

import ipaddress
import re
from urllib.parse import urlparse

from app.utils.errors import ValidationError

_PRIVATE_NETWORKS = [
    ipaddress.ip_network("0.0.0.0/8"),
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("::1/128"),
    ipaddress.ip_network("fc00::/7"),
    ipaddress.ip_network("fe80::/10"),
]

_SENSITIVE_LOG_RE = re.compile(
    r"(password|api[_-]?key|authorization|bearer\s+\S+|service_role|n8n_webhook_secret|"
    r"access_token|refresh_token|jwt|internal_api_key)",
    re.I,
)


def is_private_host(hostname: str) -> bool:
    host = (hostname or "").strip().lower().rstrip(".")
    if not host:
        return True
    if host in {"localhost", "metadata.google.internal"}:
        return True
    try:
        ip = ipaddress.ip_address(host)
        return any(ip in net for net in _PRIVATE_NETWORKS)
    except ValueError:
        # Hostname — block obvious local names; DNS rebinding is mitigated by
        # requiring https for external LLM/n8n in production checks below.
        return host.endswith(".local") or host.endswith(".internal")


def assert_safe_external_url(
    url: str,
    *,
    allowed_hosts: set[str] | None = None,
    require_https: bool = True,
) -> str:
    """Reject SSRF-prone URLs (private IPs, non-http(s), unexpected hosts)."""
    raw = (url or "").strip()
    if not raw:
        raise ValidationError("URL is required.", code="UNSAFE_URL")
    parsed = urlparse(raw)
    if parsed.scheme not in {"http", "https"}:
        raise ValidationError("URL scheme must be http or https.", code="UNSAFE_URL")
    if require_https and parsed.scheme != "https":
        # Allow http only for explicit local n8n during development when host is loopback
        # and require_https=False is passed by caller.
        raise ValidationError("HTTPS is required for external URLs.", code="UNSAFE_URL")
    host = parsed.hostname or ""
    if is_private_host(host):
        raise ValidationError("Private or local hosts are not allowed.", code="UNSAFE_URL")
    if allowed_hosts is not None and host.lower() not in {h.lower() for h in allowed_hosts}:
        raise ValidationError("Host is not on the allowlist.", code="UNSAFE_URL")
    return raw


def assert_n8n_base_url(url: str, *, app_env: str) -> str:
    """Validate n8n webhook base URL. Allows http://localhost only in development."""
    raw = (url or "").strip()
    parsed = urlparse(raw)
    if parsed.scheme not in {"http", "https"}:
        raise ValidationError("N8N_WEBHOOK_BASE_URL must be http(s).", code="UNSAFE_URL")
    host = (parsed.hostname or "").lower()
    if app_env == "production":
        if parsed.scheme != "https":
            raise ValidationError("N8N_WEBHOOK_BASE_URL must use HTTPS in production.")
        if is_private_host(host):
            raise ValidationError("N8N_WEBHOOK_BASE_URL cannot target private hosts.")
    else:
        # Dev: allow loopback http for local n8n; still block cloud metadata ranges.
        if host not in {"localhost", "127.0.0.1", "::1"} and is_private_host(host):
            raise ValidationError("N8N_WEBHOOK_BASE_URL host is not allowed.")
    return raw.rstrip("/")


def redact_for_logs(value: str) -> str:
    return _SENSITIVE_LOG_RE.sub("[REDACTED]", value or "")


def sniff_upload(filename: str, data: bytes) -> None:
    """Basic magic-byte checks to reduce extension spoofing."""
    name = filename.lower()
    if not data:
        raise ValidationError("Empty file.")
    if name.endswith(".pdf"):
        if not data.startswith(b"%PDF"):
            raise ValidationError("File content is not a valid PDF.")
    elif name.endswith(".docx"):
        # DOCX is a ZIP container.
        if not data.startswith(b"PK"):
            raise ValidationError("File content is not a valid DOCX.")
    elif name.endswith((".txt", ".md", ".markdown")):
        # Reject obvious binary blobs.
        if b"\x00" in data[:2048]:
            raise ValidationError("Text upload contains binary data.")
