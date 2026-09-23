"""Structured logging helpers — never log secrets."""

from __future__ import annotations

import logging
from typing import Any

from app.utils.security import redact_for_logs

_logger = logging.getLogger("nida.backend")


def configure_logging() -> None:
    if not logging.getLogger().handlers:
        logging.basicConfig(
            level=logging.INFO,
            format="%(asctime)s %(levelname)s %(name)s %(message)s",
        )


def log_event(
    *,
    request_id: str | None = None,
    endpoint: str | None = None,
    user_id: str | None = None,
    agent_id: str | None = None,
    workflow_id: str | None = None,
    status: str | None = None,
    duration_ms: float | None = None,
    error_category: str | None = None,
    **extra: Any,
) -> None:
    parts = [
        f"request_id={request_id or '-'}",
        f"endpoint={endpoint or '-'}",
        f"user_id={user_id or '-'}",
        f"agent_id={agent_id or '-'}",
        f"workflow_id={workflow_id or '-'}",
        f"status={status or '-'}",
        f"duration_ms={duration_ms if duration_ms is not None else '-'}",
        f"error_category={error_category or '-'}",
    ]
    for key, value in extra.items():
        safe = redact_for_logs(str(value))
        parts.append(f"{key}={safe}")
    _logger.info(" ".join(parts))
