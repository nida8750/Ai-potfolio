"""RAG service: knowledge bases, ingestion, and similarity search.

Pipeline: upload → storage → parse → clean → chunk → embed → store → top-k.
Never invents sources. Empty retrieval returns grounded=False.
"""

from __future__ import annotations

import logging
import threading
from copy import deepcopy
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from app.config import get_settings
from app.db.supabase import get_supabase_admin
from app.services.embeddings import cosine_similarity, embed_texts
from app.services.rag_parsing import chunk_text, parse_document
from app.services.storage_service import read_document_bytes, store_document_bytes
from app.utils.errors import AuthorizationError, NotFoundError, RAGError, ValidationError

logger = logging.getLogger(__name__)


def _utcnow() -> str:
    return datetime.now(UTC).isoformat()


class _RagStore:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.knowledge_bases: dict[str, dict[str, Any]] = {}
        self.documents: dict[str, dict[str, Any]] = {}
        self.chunks: dict[str, list[dict[str, Any]]] = {}  # doc_id -> chunks

    def clear(self) -> None:
        with self._lock:
            self.knowledge_bases.clear()
            self.documents.clear()
            self.chunks.clear()


_STORE = _RagStore()


def reset_rag_store() -> None:
    _STORE.clear()


def _use_supabase() -> bool:
    return get_settings().supabase_configured


def create_knowledge_base(
    *,
    owner_id: str,
    name: str,
    description: str = "",
) -> dict[str, Any]:
    title = (name or "").strip()
    if not title:
        raise ValidationError("name is required.")
    row = {
        "id": str(uuid4()),
        "name": title[:200],
        "description": (description or "")[:2000],
        "owner_id": owner_id,
        "status": "active",
        "created_at": _utcnow(),
        "updated_at": _utcnow(),
    }
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = admin.table("knowledge_bases").insert(row).execute()
            return (result.data or [row])[0]
        except Exception:  # noqa: BLE001
            logger.info("kb_create_fallback error_category=db")

    with _STORE._lock:
        _STORE.knowledge_bases[row["id"]] = row
    return deepcopy(row)


def list_knowledge_bases(*, owner_id: str) -> list[dict[str, Any]]:
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("knowledge_bases")
                .select("*")
                .eq("owner_id", owner_id)
                .neq("status", "archived")
                .order("created_at", desc=True)
                .execute()
            )
            return list(result.data or [])
        except Exception:  # noqa: BLE001
            pass

    with _STORE._lock:
        rows = [
            deepcopy(kb)
            for kb in _STORE.knowledge_bases.values()
            if kb["owner_id"] == owner_id and kb.get("status") != "archived"
        ]
    rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)
    return rows


def get_knowledge_base(*, knowledge_base_id: str, owner_id: str) -> dict[str, Any]:
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("knowledge_bases")
                .select("*")
                .eq("id", knowledge_base_id)
                .limit(1)
                .execute()
            )
            rows = result.data or []
            if not rows:
                raise NotFoundError("Knowledge base not found.")
            row = rows[0]
            if str(row.get("owner_id")) != owner_id:
                raise AuthorizationError("Not your knowledge base.")
            return row
        except (NotFoundError, AuthorizationError):
            raise
        except Exception:  # noqa: BLE001
            pass

    with _STORE._lock:
        row = _STORE.knowledge_bases.get(knowledge_base_id)
        if not row or row.get("status") == "archived":
            raise NotFoundError("Knowledge base not found.")
        if row["owner_id"] != owner_id:
            raise AuthorizationError("Not your knowledge base.")
        return deepcopy(row)


def ingest_document(
    *,
    knowledge_base_id: str,
    owner_id: str,
    filename: str,
    data: bytes,
    content_type: str | None = None,
) -> dict[str, Any]:
    """Full ingest pipeline. Returns document row + chunk count."""
    kb = get_knowledge_base(knowledge_base_id=knowledge_base_id, owner_id=owner_id)
    storage_path = store_document_bytes(
        user_id=owner_id,
        knowledge_base_id=knowledge_base_id,
        filename=filename,
        data=data,
        content_type=content_type,
    )

    doc_id = str(uuid4())
    doc = {
        "id": doc_id,
        "knowledge_base_id": knowledge_base_id,
        "name": filename,
        "storage_path": storage_path,
        "mime_type": content_type,
        "file_size": len(data),
        "status": "processing",
        "metadata": {"original_filename": filename},
        "created_at": _utcnow(),
        "updated_at": _utcnow(),
    }

    try:
        text = parse_document(filename, data)
        pieces = chunk_text(
            text,
            source=filename,
            document_id=doc_id,
        )
        if not pieces:
            raise RAGError("No text chunks produced from document.")

        vectors = embed_texts([p["content"] for p in pieces])
        chunk_rows: list[dict[str, Any]] = []
        for piece, vector in zip(pieces, vectors, strict=True):
            chunk_rows.append(
                {
                    "id": str(uuid4()),
                    "document_id": doc_id,
                    "content": piece["content"],
                    "embedding": vector,
                    "metadata": piece["metadata"],
                    "created_at": _utcnow(),
                }
            )

        doc["status"] = "ready"
        doc["metadata"] = {
            **doc["metadata"],
            "chunk_count": len(chunk_rows),
            "knowledge_base_name": kb.get("name"),
        }
        _persist_document(doc, chunk_rows)
        return {
            "document": deepcopy(doc),
            "chunk_count": len(chunk_rows),
        }
    except Exception as exc:
        doc["status"] = "failed"
        doc["metadata"] = {**doc["metadata"], "error": "ingest_failed"}
        _persist_document(doc, [])
        if isinstance(exc, (RAGError, ValidationError)):
            raise
        raise RAGError("Document ingestion failed.") from exc


def _persist_document(doc: dict[str, Any], chunks: list[dict[str, Any]]) -> None:
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            # Embeddings as lists — PostgREST accepts vector-compatible arrays.
            admin.table("documents").upsert(doc).execute()
            if chunks:
                payload = []
                for chunk in chunks:
                    payload.append(
                        {
                            "id": chunk["id"],
                            "document_id": chunk["document_id"],
                            "content": chunk["content"],
                            "embedding": chunk["embedding"],
                            "metadata": chunk["metadata"],
                            "created_at": chunk["created_at"],
                        }
                    )
                admin.table("document_chunks").insert(payload).execute()
            return
        except Exception:  # noqa: BLE001
            logger.info("rag_persist_fallback error_category=db")

    with _STORE._lock:
        _STORE.documents[doc["id"]] = deepcopy(doc)
        _STORE.chunks[doc["id"]] = deepcopy(chunks)


def list_documents(*, knowledge_base_id: str, owner_id: str) -> list[dict[str, Any]]:
    get_knowledge_base(knowledge_base_id=knowledge_base_id, owner_id=owner_id)
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            result = (
                admin.table("documents")
                .select("id,knowledge_base_id,name,mime_type,file_size,status,metadata,created_at")
                .eq("knowledge_base_id", knowledge_base_id)
                .order("created_at", desc=True)
                .execute()
            )
            return list(result.data or [])
        except Exception:  # noqa: BLE001
            pass

    with _STORE._lock:
        rows = [
            deepcopy(d)
            for d in _STORE.documents.values()
            if d["knowledge_base_id"] == knowledge_base_id
        ]
    # Never return storage internals unnecessarily; strip embedding-sized fields.
    for row in rows:
        row.pop("storage_path", None)
    rows.sort(key=lambda r: r.get("created_at") or "", reverse=True)
    return rows


def search_knowledge_base(
    *,
    knowledge_base_id: str,
    owner_id: str,
    query: str,
    top_k: int = 5,
) -> dict[str, Any]:
    """Similarity search with source metadata. Does not invent sources."""
    get_knowledge_base(knowledge_base_id=knowledge_base_id, owner_id=owner_id)
    q = (query or "").strip()
    if not q:
        raise ValidationError("query is required.")
    k = max(1, min(int(top_k), 10))
    query_vec = embed_texts([q])[0]

    candidates = _load_chunks_for_kb(knowledge_base_id)
    scored: list[tuple[float, dict[str, Any]]] = []
    for chunk in candidates:
        emb = chunk.get("embedding")
        if not isinstance(emb, list) or not emb:
            continue
        score = cosine_similarity(query_vec, emb)
        scored.append((score, chunk))

    scored.sort(key=lambda item: item[0], reverse=True)
    top = scored[:k]

    # Drop weak matches so we don't present noise as grounding.
    threshold = 0.12
    results = []
    for score, chunk in top:
        if score < threshold:
            continue
        meta = chunk.get("metadata") or {}
        results.append(
            {
                "content": chunk.get("content"),
                "score": round(float(score), 4),
                "metadata": {
                    "source": meta.get("source"),
                    "document_id": meta.get("document_id") or chunk.get("document_id"),
                    "chunk_index": meta.get("chunk_index"),
                },
            }
        )

    return {
        "query": q,
        "top_k": k,
        "chunks": results,
        "grounded": bool(results),
        "note": None if results else "no_relevant_chunks",
    }


def _load_chunks_for_kb(knowledge_base_id: str) -> list[dict[str, Any]]:
    if _use_supabase():
        try:
            admin = get_supabase_admin()
            docs = (
                admin.table("documents")
                .select("id")
                .eq("knowledge_base_id", knowledge_base_id)
                .eq("status", "ready")
                .execute()
            )
            doc_ids = [d["id"] for d in (docs.data or [])]
            if not doc_ids:
                return []
            # Fetch in batches if needed; Phase 6 keeps it simple.
            chunks = (
                admin.table("document_chunks")
                .select("id,document_id,content,embedding,metadata")
                .in_("document_id", doc_ids)
                .execute()
            )
            return list(chunks.data or [])
        except Exception:  # noqa: BLE001
            logger.info("rag_chunk_load_fallback error_category=db")

    with _STORE._lock:
        out: list[dict[str, Any]] = []
        for doc in _STORE.documents.values():
            if doc["knowledge_base_id"] != knowledge_base_id or doc.get("status") != "ready":
                continue
            out.extend(deepcopy(_STORE.chunks.get(doc["id"], [])))
        return out


def search_for_user(
    *,
    owner_id: str,
    query: str,
    top_k: int = 5,
    knowledge_base_id: str | None = None,
) -> dict[str, Any]:
    """Search one KB or all owned KBs (agent tool path)."""
    if knowledge_base_id:
        return search_knowledge_base(
            knowledge_base_id=knowledge_base_id,
            owner_id=owner_id,
            query=query,
            top_k=top_k,
        )

    bases = list_knowledge_bases(owner_id=owner_id)
    if not bases:
        return {
            "query": query,
            "top_k": top_k,
            "chunks": [],
            "grounded": False,
            "note": "no_knowledge_bases",
        }

    merged: list[dict[str, Any]] = []
    for kb in bases:
        result = search_knowledge_base(
            knowledge_base_id=str(kb["id"]),
            owner_id=owner_id,
            query=query,
            top_k=top_k,
        )
        for chunk in result.get("chunks") or []:
            meta = dict(chunk.get("metadata") or {})
            meta["knowledge_base_id"] = kb["id"]
            meta["knowledge_base_name"] = kb.get("name")
            merged.append({**chunk, "metadata": meta})

    merged.sort(key=lambda c: float(c.get("score") or 0), reverse=True)
    top = merged[:top_k]
    return {
        "query": query,
        "top_k": top_k,
        "chunks": top,
        "grounded": bool(top),
        "note": None if top else "no_relevant_chunks",
    }


def reingest_from_storage(
    *,
    knowledge_base_id: str,
    owner_id: str,
    document_id: str,
) -> dict[str, Any]:
    """Re-parse a stored document (admin/recovery helper)."""
    get_knowledge_base(knowledge_base_id=knowledge_base_id, owner_id=owner_id)
    with _STORE._lock:
        doc = _STORE.documents.get(document_id)
    if not doc:
        raise NotFoundError("Document not found.")
    data = read_document_bytes(doc["storage_path"])
    return ingest_document(
        knowledge_base_id=knowledge_base_id,
        owner_id=owner_id,
        filename=doc["name"],
        data=data,
        content_type=doc.get("mime_type"),
    )
