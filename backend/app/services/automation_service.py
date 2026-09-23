"""Business automation via n8n.

Products: LeadFlow, MailPilot, InvoiceFlow, SupportSync, ContentFlow.

Security: HMAC signing, timeout, retries, idempotency, safe errors.
Secrets never returned to clients. Frontend must not call n8n directly.
"""

from __future__ import annotations

import json
import logging
import threading
import time
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any, Literal
from uuid import uuid4

import httpx

from app.config import Settings, get_settings
from app.db.supabase import get_supabase_admin
from app.services.n8n_signature import sign_n8n_payload
from app.utils.errors import ValidationError, WorkflowExecutionError
from app.utils.security import assert_n8n_base_url

logger = logging.getLogger(__name__)

AutomationProduct = Literal[
    "leadflow",
    "mailpilot",
    "invoiceflow",
    "supportsync",
    "contentflow",
]

PRODUCTS: frozenset[str] = frozenset(
    {"leadflow", "mailpilot", "invoiceflow", "supportsync", "contentflow"}
)

PRODUCT_META: dict[str, dict[str, str]] = {
    "leadflow": {
        "name": "LeadFlow",
        "description": "Automated Lead Management",
    },
    "mailpilot": {
        "name": "MailPilot",
        "description": "Intelligent Email Processing",
    },
    "invoiceflow": {
        "name": "InvoiceFlow",
        "description": "Automated Invoice Processing",
    },
    "supportsync": {
        "name": "SupportSync",
        "description": "Customer Support Automation",
    },
    "contentflow": {
        "name": "ContentFlow",
        "description": "AI Content Workflow Automation",
    },
}

_TIMEOUT_SECONDS = 8.0
_MAX_RETRIES = 2
_RETRY_BACKOFF_SECONDS = (0.4, 1.0)


def _utcnow() -> str:
    return datetime.now(UTC).isoformat()


class _AutomationStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.workflows: dict[str, dict[str, Any]] = {}
        self.runs: dict[str, dict[str, Any]] = {}
        self.idempotency: dict[str, str] = {}

    def clear(self) -> None:
        with self._lock:
            self.workflows.clear()
            self.runs.clear()
            self.idempotency.clear()


_STORE = _AutomationStore()


def reset_automation_store() -> None:
    _STORE.clear()
    _ensure_default_workflows()


def _ensure_default_workflows() -> None:
    with _STORE._lock:
        if _STORE.workflows:
            return
        for slug, meta in PRODUCT_META.items():
            wid = str(uuid4())
            _STORE.workflows[slug] = {
                "id": wid,
                "name": meta["name"],
                "description": meta["description"],
                "workflow_type": slug,
                "n8n_workflow_id": slug,
                "status": "active",
                "configuration": {},
                "created_by": None,
                "created_at": _utcnow(),
                "updated_at": _utcnow(),
            }


_ensure_default_workflows()


def list_automation_products() -> list[dict[str, Any]]:
    _ensure_default_workflows()
    with _STORE._lock:
        return [deepcopy(w) for w in _STORE.workflows.values()]


def get_workflow_by_product(product: str) -> dict[str, Any]:
    _ensure_default_workflows()
    key = product.strip().lower()
    if key not in PRODUCTS:
        raise ValidationError("Unknown automation product.", code="UNKNOWN_PRODUCT")
    with _STORE._lock:
        return deepcopy(_STORE.workflows[key])


def _webhook_url(settings: Settings, product: str) -> str:
    """Match importable workflow paths in repo `n8n/*.json` (`nida-ai/{product}`)."""
    base = settings.n8n_webhook_base_url.rstrip("/")
    return f"{base}/nida-ai/{product}"


def _sanitize_input(payload: dict[str, Any]) -> dict[str, Any]:
    blocked = {
        "password",
        "api_key",
        "access_token",
        "refresh_token",
        "secret",
        "n8n_webhook_secret",
        "authorization",
    }
    clean: dict[str, Any] = {}
    for key, value in payload.items():
        lower = str(key).lower()
        if lower in blocked or any(b in lower for b in blocked):
            continue
        if isinstance(value, dict):
            clean[key] = _sanitize_input(value)
        else:
            clean[key] = value
    return clean


def _persist_run(row: dict[str, Any]) -> dict[str, Any]:
    settings = get_settings()
    if settings.supabase_configured:
        try:
            admin = get_supabase_admin()
            result = admin.table("workflow_runs").upsert(row).execute()
            return (result.data or [row])[0]
        except Exception:  # noqa: BLE001
            logger.info("workflow_run_persist_fallback error_category=db")

    with _STORE._lock:
        _STORE.runs[row["id"]] = deepcopy(row)
        idem = row.get("idempotency_key")
        if idem:
            _STORE.idempotency[f"{row['user_id']}:{idem}"] = row["id"]
    return deepcopy(row)


def _find_idempotent_run(user_id: str, idempotency_key: str) -> dict[str, Any] | None:
    settings = get_settings()
    if settings.supabase_configured:
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("workflow_runs")
                .select("*")
                .eq("user_id", user_id)
                .eq("idempotency_key", idempotency_key)
                .limit(1)
                .execute()
            )
            rows = result.data or []
            return rows[0] if rows else None
        except Exception:  # noqa: BLE001
            pass

    with _STORE._lock:
        run_id = _STORE.idempotency.get(f"{user_id}:{idempotency_key}")
        if not run_id:
            return None
        row = _STORE.runs.get(run_id)
        return deepcopy(row) if row else None


def list_runs_for_user(*, user_id: str, limit: int = 50) -> list[dict[str, Any]]:
    settings = get_settings()
    if settings.supabase_configured:
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("workflow_runs")
                .select("*")
                .eq("user_id", user_id)
                .order("started_at", desc=True)
                .limit(limit)
                .execute()
            )
            return list(result.data or [])
        except Exception:  # noqa: BLE001
            pass

    with _STORE._lock:
        rows = [deepcopy(r) for r in _STORE.runs.values() if r["user_id"] == user_id]
    rows.sort(key=lambda r: r.get("started_at") or "", reverse=True)
    return rows[:limit]


def _dispatch_http(
    *,
    settings: Settings,
    product: str,
    body: str,
    timestamp: str,
    signature: str,
) -> tuple[bool, str, int | None]:
    url = _webhook_url(settings, product)
    headers = {
        "content-type": "application/json",
        "x-nida-event": f"automation.{product}",
        "x-nida-timestamp": timestamp,
        "x-nida-signature": signature,
    }
    attempts = 1 + _MAX_RETRIES
    last_reason = "unknown"
    last_status: int | None = None

    for attempt in range(attempts):
        try:
            with httpx.Client(timeout=_TIMEOUT_SECONDS) as client:
                response = client.post(url, content=body, headers=headers)
            last_status = response.status_code
            if 200 <= response.status_code < 300:
                return True, "sent", response.status_code
            last_reason = f"http_{response.status_code}"
            if response.status_code < 500 and response.status_code != 429:
                return False, last_reason, response.status_code
        except httpx.TimeoutException:
            last_reason = "timeout"
        except httpx.HTTPError:
            last_reason = "http_error"

        if attempt < attempts - 1:
            time.sleep(_RETRY_BACKOFF_SECONDS[min(attempt, len(_RETRY_BACKOFF_SECONDS) - 1)])

    return False, last_reason, last_status


def trigger_automation(
    *,
    product: str,
    user_id: str,
    payload: dict[str, Any],
    idempotency_key: str | None = None,
    settings: Settings | None = None,
) -> dict[str, Any]:
    cfg = settings or get_settings()
    key = product.strip().lower()
    if key not in PRODUCTS:
        raise ValidationError("Unknown automation product.", code="UNKNOWN_PRODUCT")

    safe_payload = _sanitize_input(payload if isinstance(payload, dict) else {})
    workflow = get_workflow_by_product(key)

    if idempotency_key:
        existing = _find_idempotent_run(user_id, idempotency_key.strip())
        if existing:
            return {
                "product": key,
                "workflow_id": existing.get("workflow_id"),
                "run": existing,
                "idempotent_replay": True,
                "n8n_configured": cfg.n8n_configured,
            }

    run_id = str(uuid4())
    run: dict[str, Any] = {
        "id": run_id,
        "workflow_id": workflow["id"],
        "user_id": user_id,
        "status": "pending",
        "input": safe_payload,
        "output": None,
        "error": None,
        "idempotency_key": idempotency_key.strip() if idempotency_key else None,
        "started_at": _utcnow(),
        "completed_at": None,
    }
    _persist_run(run)

    if not cfg.n8n_configured:
        run["status"] = "succeeded"
        run["output"] = {
            "status": "skipped",
            "reason": "not_configured",
            "product": key,
            "note": ("N8N_WEBHOOK_BASE_URL and N8N_WEBHOOK_SECRET are required for live dispatch."),
        }
        run["completed_at"] = _utcnow()
        _persist_run(run)
        logger.info(
            "automation_skipped product=%s user_id=%s error_category=not_configured",
            key,
            user_id,
        )
        return {
            "product": key,
            "workflow_id": workflow["id"],
            "run": run,
            "idempotent_replay": False,
            "n8n_configured": False,
        }

    try:
        assert_n8n_base_url(cfg.n8n_webhook_base_url, app_env=cfg.app_env)
    except ValidationError as exc:
        run["status"] = "failed"
        run["error"] = "unsafe_n8n_url"
        run["output"] = {"status": "failed", "reason": "unsafe_n8n_url"}
        run["completed_at"] = _utcnow()
        _persist_run(run)
        raise WorkflowExecutionError(
            "Automation endpoint is misconfigured.",
            code="UNSAFE_URL",
        ) from exc

    envelope = {
        "event": f"automation.{key}",
        "product": key,
        "runId": run_id,
        "userId": user_id,
        "sentAt": datetime.now(UTC).isoformat(),
        "data": safe_payload,
    }
    body = json.dumps(envelope, separators=(",", ":"), default=str)
    timestamp = str(int(time.time() * 1000))
    signature = sign_n8n_payload(cfg.n8n_webhook_secret, body, timestamp)

    run["status"] = "running"
    _persist_run(run)

    ok, reason, http_status = _dispatch_http(
        settings=cfg,
        product=key,
        body=body,
        timestamp=timestamp,
        signature=signature,
    )

    if ok:
        run["status"] = "succeeded"
        run["output"] = {
            "status": "sent",
            "http_status": http_status,
            "product": key,
        }
        run["error"] = None
        logger.info(
            "automation_sent product=%s user_id=%s status=%s",
            key,
            user_id,
            http_status,
        )
    else:
        run["status"] = "failed"
        run["output"] = {
            "status": "failed",
            "reason": reason,
            "http_status": http_status,
            "product": key,
        }
        run["error"] = reason
        logger.info(
            "automation_failed product=%s user_id=%s error_category=%s",
            key,
            user_id,
            reason,
        )

    run["completed_at"] = _utcnow()
    _persist_run(run)

    if run["status"] == "failed":
        raise WorkflowExecutionError(
            "Automation workflow failed. Please try again later.",
            code="WORKFLOW_FAILED",
        )

    return {
        "product": key,
        "workflow_id": workflow["id"],
        "run": run,
        "idempotent_replay": False,
        "n8n_configured": True,
    }


def trigger_from_agent(
    *,
    product: str,
    user_id: str | None,
    payload: dict[str, Any] | None = None,
) -> dict[str, Any]:
    if not user_id:
        return {"ok": False, "error": "user_context_required", "workflow": product}
    try:
        result = trigger_automation(
            product=product,
            user_id=user_id,
            payload=payload or {},
        )
        run = result["run"]
        return {
            "ok": run.get("status") in {"succeeded", "pending", "running"},
            "workflow": product,
            "status": run.get("status"),
            "run_id": run.get("id"),
            "n8n_configured": result.get("n8n_configured"),
            "output": run.get("output"),
        }
    except WorkflowExecutionError:
        return {"ok": False, "error": "workflow_failed", "workflow": product}
    except ValidationError as exc:
        return {"ok": False, "error": exc.code, "message": exc.message}
