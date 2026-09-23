"""Phase 12 — honest stack integration status (no invented credentials or stats)."""

from __future__ import annotations

from typing import Any

from app.config import Settings, get_settings, is_configured, is_supabase_api_url
from app.db.supabase import check_supabase_connectivity


def _layer(name: str, status: str, detail: str = "") -> dict[str, str]:
    row = {"name": name, "status": status}
    if detail:
        row["detail"] = detail
    return row


def build_integration_status(settings: Settings | None = None) -> dict[str, Any]:
    """Report each stack layer without probing external systems beyond Supabase."""
    cfg = settings or get_settings()
    supabase = check_supabase_connectivity(cfg)

    if not is_configured(cfg.supabase_url):
        supabase_status = "not_configured"
        supabase_detail = "SUPABASE_URL empty"
    elif not is_supabase_api_url(cfg.supabase_url):
        supabase_status = "misconfigured"
        supabase_detail = "SUPABASE_URL must be https://…supabase.co (not a Postgres URI)"
    elif not supabase.configured:
        supabase_status = "not_configured"
        supabase_detail = "anon/service role keys missing or placeholders"
    elif supabase.reachable is True:
        supabase_status = "ok"
        supabase_detail = supabase.detail
    elif supabase.reachable is False:
        supabase_status = "unreachable"
        supabase_detail = supabase.detail
    else:
        supabase_status = "unknown"
        supabase_detail = supabase.detail

    layers = [
        _layer("nextjs", "external", "Call via FRONTEND_URL / Next.js BFF"),
        _layer("fastapi", "ok"),
        _layer("supabase", supabase_status, supabase_detail),
        _layer(
            "langgraph",
            "ok",
            "heuristic router always; LLM router when LLM_API_KEY set",
        ),
        _layer(
            "rag",
            "ok",
            "local embeddings + in-memory store; pgvector when Supabase configured",
        ),
        _layer(
            "n8n",
            "configured" if cfg.n8n_configured else "not_configured",
            "" if cfg.n8n_configured else "Set N8N_WEBHOOK_BASE_URL and N8N_WEBHOOK_SECRET",
        ),
        _layer(
            "llm",
            "configured" if cfg.llm_configured else "not_configured",
            "" if cfg.llm_configured else "Set LLM_API_KEY (optional)",
        ),
        _layer(
            "internal_bff",
            "configured" if is_configured(cfg.internal_api_key) else "not_configured",
            "Next.js admin AI dashboard uses INTERNAL_API_KEY",
        ),
    ]

    blocking = [
        layer["name"] for layer in layers if layer["status"] in {"misconfigured", "unreachable"}
    ]
    optional_missing = [
        layer["name"]
        for layer in layers
        if layer["status"] == "not_configured"
        and layer["name"] in {"supabase", "n8n", "llm", "internal_bff"}
    ]

    return {
        "ok": len(blocking) == 0,
        "stack": [
            "Next.js",
            "FastAPI",
            "Supabase",
            "LangGraph",
            "RAG",
            "n8n",
        ],
        "layers": layers,
        "blocking": blocking,
        "optional_missing": optional_missing,
        "frontend_url": cfg.frontend_url,
    }
