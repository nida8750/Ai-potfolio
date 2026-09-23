"""Request ID middleware."""

from __future__ import annotations

import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.utils.logging import log_event


class RequestIdMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = request_id
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            duration = (time.perf_counter() - started) * 1000
            log_event(
                request_id=request_id,
                endpoint=request.url.path,
                status="error",
                duration_ms=round(duration, 2),
                error_category="unhandled",
            )
            raise
        duration = (time.perf_counter() - started) * 1000
        response.headers["X-Request-ID"] = request_id
        log_event(
            request_id=request_id,
            endpoint=request.url.path,
            status=str(response.status_code),
            duration_ms=round(duration, 2),
        )
        return response
