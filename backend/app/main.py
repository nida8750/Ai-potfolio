"""Phase 1–12 FastAPI app with security middleware."""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import __version__
from app.api.router import api_router
from app.api.v1.health import health_payload
from app.config import settings
from app.middleware.request_id import RequestIdMiddleware
from app.schemas.common import ok
from app.utils.errors import AppError
from app.utils.logging import configure_logging

configure_logging()

app = FastAPI(
    title=settings.app_name,
    version=__version__,
    description="Production-oriented backend for the Nida AI portfolio.",
)

# Tight CORS: only the configured frontend origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=[
        "Authorization",
        "Content-Type",
        "Accept",
        "X-Request-ID",
        "X-Internal-Key",
        "Idempotency-Key",
    ],
    expose_headers=["X-Request-ID"],
)
app.add_middleware(RequestIdMiddleware)

app.include_router(api_router)


@app.exception_handler(AppError)
async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(status_code=exc.status_code, content=exc.to_body())


@app.get("/")
def root() -> dict:
    return ok(
        {
            "service": settings.app_name,
            "docs": "/docs",
            "health": "/health",
            "api": "/api/v1/health",
        }
    )


@app.get("/health")
def health() -> dict:
    return ok(health_payload())
