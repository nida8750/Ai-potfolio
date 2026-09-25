"""Dashboard aggregates from real stores only.

Empty platform → 0 and []. Never invents statistics.
"""

from __future__ import annotations

from typing import Any

from app.config import get_settings, is_configured
from app.db.supabase import get_supabase_admin
from app.services import agent_service, automation_service, conversation_service, rag_service
from app.services.conversation_service import _STORE as _CHAT_STORE


def _empty_overview() -> dict[str, Any]:
    return {
        "total_agents": 0,
        "total_tasks": 0,
        "successful_runs": 0,
        "failed_runs": 0,
        "active_workflows": 0,
        "total_conversations": 0,
        "total_knowledge_bases": 0,
        "total_documents": 0,
        "recent_agent_activity": [],
        "recent_workflow_runs": [],
        "recent_users": [],
        "notifications": [],
        "llm": _llm_ops(),
        "token_usage": _empty_token_usage(),
    }


def platform_overview() -> dict[str, Any]:
    """Admin / platform-wide AI metrics from real in-memory or Supabase data."""
    agents = agent_service.list_agents()
    workflows = automation_service.list_automation_products()
    active_workflows = sum(1 for w in workflows if w.get("status") == "active")

    agent_runs = _collect_all_agent_runs()
    workflow_runs = _collect_all_workflow_runs()
    conversations = _collect_all_conversations()

    successful = sum(1 for r in agent_runs if r.get("status") == "succeeded")
    failed = sum(1 for r in agent_runs if r.get("status") == "failed")
    # "tasks" = agent runs + workflow runs (real executions only)
    total_tasks = len(agent_runs) + len(workflow_runs)

    kb_count, doc_count = _count_knowledge()

    recent_agent = sorted(
        agent_runs,
        key=lambda r: r.get("created_at") or r.get("completed_at") or "",
        reverse=True,
    )[:10]
    recent_workflows = sorted(
        workflow_runs,
        key=lambda r: r.get("started_at") or "",
        reverse=True,
    )[:10]

    return {
        "total_agents": len(agents),
        "total_tasks": total_tasks,
        "successful_runs": successful,
        "failed_runs": failed,
        "active_workflows": active_workflows,
        "total_conversations": len(conversations),
        "total_knowledge_bases": kb_count,
        "total_documents": doc_count,
        "recent_agent_activity": [
            {
                "id": r.get("id"),
                "status": r.get("status"),
                "agent_id": r.get("agent_id"),
                "conversation_id": r.get("conversation_id"),
                "created_at": r.get("created_at"),
                "completed_at": r.get("completed_at"),
                "error": r.get("error"),
            }
            for r in recent_agent
        ],
        "recent_workflow_runs": [
            {
                "id": r.get("id"),
                "status": r.get("status"),
                "workflow_id": r.get("workflow_id"),
                "user_id": r.get("user_id"),
                "started_at": r.get("started_at"),
                "completed_at": r.get("completed_at"),
                "error": r.get("error"),
            }
            for r in recent_workflows
        ],
        "recent_users": _recent_users(),
        # Per-user notifications are filled in user_overview.
        "notifications": [],
        "llm": _llm_ops(),
        "token_usage": _collect_token_usage(agent_runs),
    }


def user_overview(*, user_id: str) -> dict[str, Any]:
    """Authenticated user dashboard — only their records."""
    agents = agent_service.list_agents()
    conversations = conversation_service.list_conversations(user_id=user_id)
    runs: list[dict[str, Any]] = []
    for conv in conversations:
        runs.extend(
            conversation_service.list_agent_runs(conversation_id=str(conv["id"]), user_id=user_id)
        )
    workflow_runs = automation_service.list_runs_for_user(user_id=user_id)
    kbs = rag_service.list_knowledge_bases(owner_id=user_id)
    docs = 0
    for kb in kbs:
        docs += len(rag_service.list_documents(knowledge_base_id=str(kb["id"]), owner_id=user_id))

    successful = sum(1 for r in runs if r.get("status") == "succeeded")
    failed = sum(1 for r in runs if r.get("status") == "failed")
    active_workflows = sum(
        1 for w in automation_service.list_automation_products() if w.get("status") == "active"
    )

    recent_agent = sorted(runs, key=lambda r: r.get("created_at") or "", reverse=True)[:10]
    recent_workflows = sorted(workflow_runs, key=lambda r: r.get("started_at") or "", reverse=True)[
        :10
    ]

    return {
        "total_agents": len(agents),
        "total_tasks": len(runs) + len(workflow_runs),
        "successful_runs": successful,
        "failed_runs": failed,
        "active_workflows": active_workflows,
        "total_conversations": len(conversations),
        "total_knowledge_bases": len(kbs),
        "total_documents": docs,
        "recent_agent_activity": [
            {
                "id": r.get("id"),
                "status": r.get("status"),
                "agent_id": r.get("agent_id"),
                "conversation_id": r.get("conversation_id"),
                "created_at": r.get("created_at"),
                "completed_at": r.get("completed_at"),
            }
            for r in recent_agent
        ],
        "recent_workflow_runs": [
            {
                "id": r.get("id"),
                "status": r.get("status"),
                "workflow_id": r.get("workflow_id"),
                "started_at": r.get("started_at"),
                "completed_at": r.get("completed_at"),
            }
            for r in recent_workflows
        ],
        "recent_users": [],
        "notifications": _user_notifications(user_id),
        "llm": _llm_ops(),
        "token_usage": _sum_token_usage(runs),
    }


def _collect_all_agent_runs() -> list[dict[str, Any]]:
    settings = get_settings()
    if settings.supabase_configured:
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("agent_runs")
                .select("*")
                .order("created_at", desc=True)
                .limit(500)
                .execute()
            )
            return list(result.data or [])
        except Exception:  # noqa: BLE001
            pass

    runs: list[dict[str, Any]] = []
    with _CHAT_STORE._lock:
        for items in _CHAT_STORE.agent_runs.values():
            runs.extend(items)
    return runs


def _collect_all_workflow_runs() -> list[dict[str, Any]]:
    settings = get_settings()
    if settings.supabase_configured:
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("workflow_runs")
                .select("*")
                .order("started_at", desc=True)
                .limit(500)
                .execute()
            )
            return list(result.data or [])
        except Exception:  # noqa: BLE001
            pass

    from app.services.automation_service import _STORE as auto_store

    with auto_store._lock:
        return list(auto_store.runs.values())


def _collect_all_conversations() -> list[dict[str, Any]]:
    settings = get_settings()
    if settings.supabase_configured:
        try:
            admin = get_supabase_admin()
            result = admin.table("conversations").select("id").execute()
            return list(result.data or [])
        except Exception:  # noqa: BLE001
            pass

    with _CHAT_STORE._lock:
        return [c for c in _CHAT_STORE.conversations.values() if c.get("status") != "deleted"]


def _count_knowledge() -> tuple[int, int]:
    settings = get_settings()
    if settings.supabase_configured:
        try:
            admin = get_supabase_admin()
            kbs = admin.table("knowledge_bases").select("id").execute()
            docs = admin.table("documents").select("id").execute()
            return len(kbs.data or []), len(docs.data or [])
        except Exception:  # noqa: BLE001
            pass

    from app.services.rag_service import _STORE as rag_store

    with rag_store._lock:
        return len(rag_store.knowledge_bases), len(rag_store.documents)


def _llm_ops() -> dict[str, Any]:
    cfg = get_settings()
    configured = cfg.llm_configured
    model = cfg.llm_model.strip() if is_configured(cfg.llm_model) else ""
    return {
        "configured": configured,
        "model": (model or "gpt-4o-mini") if configured else None,
        "provider": "openai" if configured else None,
        "router": "llm" if configured else "heuristic",
    }


def _empty_token_usage() -> dict[str, int]:
    return {
        "prompt_tokens": 0,
        "completion_tokens": 0,
        "total_tokens": 0,
        "records_with_usage": 0,
    }


def _usage_int(usage: dict[str, Any], *keys: str) -> int:
    for key in keys:
        raw = usage.get(key)
        if isinstance(raw, bool):
            continue
        if isinstance(raw, (int, float)) and raw >= 0:
            return int(raw)
    return 0


def _sum_token_usage(rows: list[dict[str, Any]]) -> dict[str, int]:
    totals = _empty_token_usage()
    for row in rows:
        usage = row.get("token_usage") if isinstance(row, dict) else None
        if usage is None and isinstance(row, dict):
            metadata = row.get("metadata")
            if isinstance(metadata, dict):
                nested = metadata.get("token_usage") or metadata.get("usage")
                usage = nested if isinstance(nested, dict) else None
        if not isinstance(usage, dict):
            continue
        prompt = _usage_int(usage, "prompt_tokens", "input_tokens")
        completion = _usage_int(usage, "completion_tokens", "output_tokens")
        total = _usage_int(usage, "total_tokens")
        if total == 0:
            total = prompt + completion
        if prompt == 0 and completion == 0 and total == 0:
            continue
        totals["prompt_tokens"] += prompt
        totals["completion_tokens"] += completion
        totals["total_tokens"] += total
        totals["records_with_usage"] += 1
    return totals


def _collect_token_usage(agent_runs: list[dict[str, Any]]) -> dict[str, int]:
    message_rows: list[dict[str, Any]] = []
    settings = get_settings()
    if settings.supabase_configured:
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("messages")
                .select("token_usage")
                .not_.is_("token_usage", "null")
                .limit(2000)
                .execute()
            )
            message_rows = list(result.data or [])
        except Exception:  # noqa: BLE001
            pass
    else:
        with _CHAT_STORE._lock:
            for items in _CHAT_STORE.messages.values():
                message_rows.extend(items)
    from_messages = _sum_token_usage(message_rows)
    if from_messages["records_with_usage"] > 0:
        return from_messages
    return _sum_token_usage(agent_runs)


def _recent_users() -> list[dict[str, Any]]:
    settings = get_settings()
    if not settings.supabase_configured:
        return []
    try:
        admin = get_supabase_admin()
        result = (
            admin.table("profiles")
            .select("id,email,name,role,status,created_at")
            .order("created_at", desc=True)
            .limit(10)
            .execute()
        )
        return list(result.data or [])
    except Exception:  # noqa: BLE001
        return []


def _user_notifications(user_id: str) -> list[dict[str, Any]]:
    settings = get_settings()
    if not settings.supabase_configured:
        return []
    try:
        admin = get_supabase_admin()
        result = (
            admin.table("notifications")
            .select("id,type,title,message,read,created_at")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(20)
            .execute()
        )
        return list(result.data or [])
    except Exception:  # noqa: BLE001
        return []
