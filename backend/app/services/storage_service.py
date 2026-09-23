"""Document storage for RAG uploads.

Uses Supabase Storage when configured; otherwise local `.data/knowledge`.
Never logs document body contents.
"""

from __future__ import annotations

import logging
from pathlib import Path
from uuid import uuid4

from app.config import get_settings
from app.db.supabase import get_supabase_admin
from app.utils.errors import RAGError, ValidationError
from app.utils.security import sniff_upload

logger = logging.getLogger(__name__)

_ROOT = Path(__file__).resolve().parents[2] / ".data" / "knowledge"
_MAX_BYTES = 20 * 1024 * 1024  # 20 MB

ALLOWED_MIME = frozenset(
    {
        "application/pdf",
        "text/plain",
        "text/markdown",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }
)

ALLOWED_EXTENSIONS = frozenset({".pdf", ".txt", ".md", ".markdown", ".docx"})


def _ext(filename: str) -> str:
    return Path(filename).suffix.lower()


def validate_upload(filename: str, content_type: str | None, size: int) -> None:
    if size <= 0:
        raise ValidationError("Empty file.")
    if size > _MAX_BYTES:
        raise ValidationError("File exceeds 20MB upload limit.")
    ext = _ext(filename)
    if ext not in ALLOWED_EXTENSIONS:
        raise ValidationError("Unsupported file type. Allowed: PDF, TXT, Markdown, DOCX.")
    if content_type and content_type.split(";")[0].strip().lower() not in ALLOWED_MIME:
        # Some browsers send octet-stream; extension still gates.
        if content_type.split(";")[0].strip().lower() not in {
            "application/octet-stream",
            "binary/octet-stream",
        }:
            if ext not in ALLOWED_EXTENSIONS:
                raise ValidationError("Unsupported content type.")


def store_document_bytes(
    *,
    user_id: str,
    knowledge_base_id: str,
    filename: str,
    data: bytes,
    content_type: str | None = None,
) -> str:
    """Persist bytes; return storage_path."""
    validate_upload(filename, content_type, len(data))
    sniff_upload(filename, data)
    # Path segments must stay within UUID-like ids (IDOR/path traversal defense).
    safe_user = "".join(ch for ch in user_id if ch.isalnum() or ch in "-_")[:80]
    safe_kb = "".join(ch for ch in knowledge_base_id if ch.isalnum() or ch in "-_")[:80]
    safe_name = Path(filename).name.replace("..", "_")
    doc_key = str(uuid4())
    relative = f"{safe_user}/{safe_kb}/{doc_key}/{safe_name}"

    settings = get_settings()
    if settings.supabase_configured:
        try:
            admin = get_supabase_admin()
            admin.storage.from_("knowledge").upload(
                relative,
                data,
                file_options={
                    "content-type": content_type or "application/octet-stream",
                    "upsert": "false",
                },
            )
            return relative
        except Exception as exc:  # noqa: BLE001
            logger.info("supabase_storage_fallback error_category=storage")
            # Fall through to local for dev resilience.
            _ = exc

    path = _ROOT / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return relative


def read_document_bytes(storage_path: str) -> bytes:
    settings = get_settings()
    if settings.supabase_configured:
        try:
            admin = get_supabase_admin()
            data = admin.storage.from_("knowledge").download(storage_path)
            if isinstance(data, bytes):
                return data
        except Exception:  # noqa: BLE001
            logger.info("supabase_storage_read_fallback error_category=storage")

    path = _ROOT / storage_path
    if not path.is_file():
        raise RAGError("Stored document not found.")
    return path.read_bytes()
