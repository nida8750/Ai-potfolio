"""Embedding providers for RAG.

Uses OpenAI embeddings when LLM_API_KEY is set; otherwise a deterministic
local hashing embedder so Phase 6 works without inventing credentials.
Dimension stays 1536 to match the pgvector migration.
"""

from __future__ import annotations

import hashlib
import logging
import math
import re
from collections.abc import Sequence

import httpx

from app.config import Settings, get_settings, is_configured

logger = logging.getLogger(__name__)

EMBEDDING_DIM = 1536
_TOKEN_RE = re.compile(r"[a-z0-9_]+", re.I)


def _normalize(vec: list[float]) -> list[float]:
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]


def local_embed(text: str, *, dim: int = EMBEDDING_DIM) -> list[float]:
    """Deterministic bag-of-tokens hashing embedder (dev / offline)."""
    vec = [0.0] * dim
    tokens = _TOKEN_RE.findall((text or "").lower())
    if not tokens:
        return _normalize(vec)
    for token in tokens:
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        idx = int.from_bytes(digest[:4], "big") % dim
        sign = 1.0 if digest[4] % 2 == 0 else -1.0
        vec[idx] += sign
    return _normalize(vec)


def openai_embed(texts: Sequence[str], *, settings: Settings | None = None) -> list[list[float]]:
    cfg = settings or get_settings()
    if not cfg.llm_configured:
        raise RuntimeError("LLM_API_KEY not configured")
    model = "text-embedding-3-small"
    if is_configured(cfg.llm_model) and "embed" in cfg.llm_model.lower():
        model = cfg.llm_model.strip()
    payload = {"model": model, "input": list(texts)}
    headers = {
        "Authorization": f"Bearer {cfg.llm_api_key}",
        "Content-Type": "application/json",
    }
    with httpx.Client(timeout=60.0) as client:
        response = client.post(
            "https://api.openai.com/v1/embeddings",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        body = response.json()
    items = sorted(body["data"], key=lambda row: row["index"])
    vectors = [list(map(float, row["embedding"])) for row in items]
    # Pad / trim to EMBEDDING_DIM if provider differs.
    out: list[list[float]] = []
    for vec in vectors:
        if len(vec) < EMBEDDING_DIM:
            vec = vec + [0.0] * (EMBEDDING_DIM - len(vec))
        out.append(_normalize(vec[:EMBEDDING_DIM]))
    return out


def embed_texts(texts: Sequence[str], *, settings: Settings | None = None) -> list[list[float]]:
    cfg = settings or get_settings()
    if not texts:
        return []
    if cfg.llm_configured:
        try:
            return openai_embed(texts, settings=cfg)
        except Exception:  # noqa: BLE001
            logger.info("openai_embed_failed error_category=llm falling_back=local")
    return [local_embed(t) for t in texts]


def cosine_similarity(a: Sequence[float], b: Sequence[float]) -> float:
    return float(sum(x * y for x, y in zip(a, b, strict=False)))
