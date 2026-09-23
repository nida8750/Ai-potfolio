"""In-memory rate limiter (swappable for Redis later)."""

from __future__ import annotations

import threading
import time
from collections import defaultdict, deque
from dataclasses import dataclass

from fastapi import HTTPException, Request, status


@dataclass(frozen=True, slots=True)
class RateLimitRule:
    key: str
    limit: int
    window_seconds: float


class RateLimiter:
    """Abstract rate limiting surface — replace backend without changing callers."""

    def allow(self, bucket: str, *, limit: int, window_seconds: float) -> bool:
        raise NotImplementedError


class MemoryRateLimiter(RateLimiter):
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._hits: dict[str, deque[float]] = defaultdict(deque)

    def allow(self, bucket: str, *, limit: int, window_seconds: float) -> bool:
        now = time.monotonic()
        with self._lock:
            q = self._hits[bucket]
            cutoff = now - window_seconds
            while q and q[0] < cutoff:
                q.popleft()
            if len(q) >= limit:
                return False
            q.append(now)
            return True

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


_limiter = MemoryRateLimiter()


def get_rate_limiter() -> RateLimiter:
    return _limiter


def reset_rate_limiter() -> None:
    _limiter.reset()


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip() or "unknown"
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def enforce_rate_limit(
    request: Request,
    *,
    scope: str,
    limit: int,
    window_seconds: float = 60.0,
) -> None:
    ip = client_ip(request)
    bucket = f"{scope}:{ip}"
    if not get_rate_limiter().allow(bucket, limit=limit, window_seconds=window_seconds):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail={
                "code": "RATE_LIMITED",
                "message": "Too many requests. Please try again later.",
            },
        )


# Production-oriented defaults (per IP).
AUTH_LIMIT = RateLimitRule("auth", limit=20, window_seconds=60)
AGENT_LIMIT = RateLimitRule("agent", limit=30, window_seconds=60)
RAG_UPLOAD_LIMIT = RateLimitRule("rag_upload", limit=10, window_seconds=60)
RAG_SEARCH_LIMIT = RateLimitRule("rag_search", limit=60, window_seconds=60)
N8N_LIMIT = RateLimitRule("n8n", limit=20, window_seconds=60)
CHAT_LIMIT = RateLimitRule("chat", limit=40, window_seconds=60)
