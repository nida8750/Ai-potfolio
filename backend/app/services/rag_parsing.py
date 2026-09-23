"""Parse / clean / chunk documents for RAG."""

from __future__ import annotations

import io
import re
from typing import Any

from app.utils.errors import RAGError, ValidationError


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def parse_document(filename: str, data: bytes) -> str:
    """Extract plain text from PDF / TXT / Markdown / DOCX."""
    name = filename.lower()
    try:
        if name.endswith((".txt", ".md", ".markdown")):
            return clean_text(data.decode("utf-8", errors="replace"))
        if name.endswith(".pdf"):
            return clean_text(_parse_pdf(data))
        if name.endswith(".docx"):
            return clean_text(_parse_docx(data))
    except ValidationError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise RAGError("Failed to parse document.") from exc
    raise ValidationError("Unsupported file type.")


def _parse_pdf(data: bytes) -> str:
    try:
        from pypdf import PdfReader
    except ImportError as exc:  # pragma: no cover
        raise RAGError("PDF support requires pypdf.") from exc
    reader = PdfReader(io.BytesIO(data))
    parts: list[str] = []
    for page in reader.pages:
        parts.append(page.extract_text() or "")
    text = "\n".join(parts)
    if not text.strip():
        raise RAGError("PDF contained no extractable text.")
    return text


def _parse_docx(data: bytes) -> str:
    try:
        import docx
    except ImportError as exc:  # pragma: no cover
        raise RAGError("DOCX support requires python-docx.") from exc
    document = docx.Document(io.BytesIO(data))
    text = "\n".join(p.text for p in document.paragraphs)
    if not text.strip():
        raise RAGError("DOCX contained no extractable text.")
    return text


def chunk_text(
    text: str,
    *,
    chunk_size: int = 800,
    overlap: int = 120,
    source: str,
    document_id: str,
) -> list[dict[str, Any]]:
    """Split cleaned text into overlapping chunks with source metadata."""
    cleaned = clean_text(text)
    if not cleaned:
        return []
    chunks: list[dict[str, Any]] = []
    start = 0
    index = 0
    length = len(cleaned)
    while start < length:
        end = min(start + chunk_size, length)
        # Prefer breaking on paragraph/sentence boundaries.
        if end < length:
            window = cleaned[start:end]
            break_at = max(window.rfind("\n\n"), window.rfind(". "), window.rfind("\n"))
            if break_at > chunk_size // 3:
                end = start + break_at + 1
        piece = cleaned[start:end].strip()
        if piece:
            chunks.append(
                {
                    "content": piece,
                    "metadata": {
                        "source": source,
                        "document_id": document_id,
                        "chunk_index": index,
                        "char_start": start,
                        "char_end": end,
                    },
                }
            )
            index += 1
        if end >= length:
            break
        start = max(end - overlap, start + 1)
    return chunks
