"""LLM provider abstraction. Works without keys via heuristic fallback."""

from __future__ import annotations

import json
import logging
import re
from typing import Any, Literal

import httpx

from app.config import Settings, get_settings, is_configured
from app.utils.errors import ServiceUnavailableError
from app.utils.security import assert_safe_external_url

logger = logging.getLogger(__name__)

RouteName = Literal["research", "rag", "automation", "support"]


def heuristic_route(user_input: str) -> tuple[RouteName, str]:
    """Deterministic supervisor routing used when no LLM key is present."""
    text = (user_input or "").lower()

    def has(*keywords: str) -> bool:
        for key in keywords:
            if " " in key:
                if key in text:
                    return True
            elif re.search(rf"\b{re.escape(key)}\b", text):
                return True
        return False

    if has(
        "automate",
        "automation",
        "n8n",
        "workflow",
        "leadflow",
        "mailpilot",
        "invoiceflow",
        "supportsync",
        "contentflow",
        "invoice",
        "lead management",
    ):
        return "automation", "keyword:automation"
    if has(
        "document",
        "knowledge",
        "pdf",
        "rag",
        "retrieve",
        "from my files",
        "knowledge base",
        "uploaded",
        "grounded",
    ):
        return "rag", "keyword:rag"
    if has(
        "research",
        "search",
        "look up",
        "find out",
        "what is",
        "compare",
        "investigate",
    ):
        return "research", "keyword:research"
    return "support", "keyword:support_default"


def _extract_json_object(text: str) -> dict[str, Any] | None:
    match = re.search(r"\{[\s\S]*\}", text)
    if not match:
        return None
    try:
        data = json.loads(match.group(0))
    except json.JSONDecodeError:
        return None
    return data if isinstance(data, dict) else None


def llm_route(user_input: str, *, settings: Settings | None = None) -> tuple[RouteName, str]:
    """Ask the configured LLM to choose a specialist. Falls back to heuristics."""
    cfg = settings or get_settings()
    if not cfg.llm_configured:
        return heuristic_route(user_input)

    model = cfg.llm_model.strip() if is_configured(cfg.llm_model) else "gpt-4o-mini"
    system = (
        "You are a routing supervisor. Choose exactly one agent: "
        "research, rag, automation, support. "
        'Reply with JSON only: {"agent":"support","reason":"..."}. '
        "Never reveal hidden chain-of-thought."
    )
    payload = {
        "model": model,
        "temperature": 0,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user_input[:4000]},
        ],
    }
    headers = {
        "Authorization": f"Bearer {cfg.llm_api_key}",
        "Content-Type": "application/json",
    }
    llm_url = "https://api.openai.com/v1/chat/completions"
    assert_safe_external_url(llm_url, allowed_hosts={"api.openai.com"}, require_https=True)
    try:
        with httpx.Client(timeout=20.0) as client:
            response = client.post(
                llm_url,
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            body = response.json()
        content = body["choices"][0]["message"]["content"]
        parsed = _extract_json_object(content) or {}
        agent = str(parsed.get("agent") or "").lower()
        reason = str(parsed.get("reason") or "llm")
        if agent in {"research", "rag", "automation", "support"}:
            return agent, f"llm:{reason}"  # type: ignore[return-value]
    except Exception:  # noqa: BLE001
        logger.info("llm_route_failed error_category=llm falling_back=heuristic")
    return heuristic_route(user_input)


def llm_complete(
    *,
    system: str,
    user: str,
    settings: Settings | None = None,
) -> str:
    """Optional text completion. Raises if LLM is required but missing."""
    cfg = settings or get_settings()
    if not cfg.llm_configured:
        raise ServiceUnavailableError(
            "LLM is not configured. Set LLM_API_KEY (and optionally LLM_MODEL)."
        )
    model = cfg.llm_model.strip() if is_configured(cfg.llm_model) else "gpt-4o-mini"
    payload = {
        "model": model,
        "temperature": 0.2,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user[:8000]},
        ],
    }
    headers = {
        "Authorization": f"Bearer {cfg.llm_api_key}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=45.0) as client:
        response = client.post(
            "https://api.openai.com/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        body = response.json()
    return str(body["choices"][0]["message"]["content"])
