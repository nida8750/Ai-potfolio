"""FastAPI dependencies: settings, auth, RBAC.

Identity is derived only from a validated Supabase access token + profiles row.
Never trust user_id or role from the request body.
"""

from __future__ import annotations

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status

from app.config import Settings, get_settings
from app.services.auth_service import CurrentUser, assert_admin, validate_access_token
from app.utils.errors import AppError, AuthenticationError, AuthorizationError


def get_app_settings() -> Settings:
    return get_settings()


SettingsDep = Annotated[Settings, Depends(get_app_settings)]


def _http_from_app_error(exc: AppError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.to_body()["error"])


def get_bearer_token(authorization: Annotated[str | None, Header()] = None) -> str:
    """Extract a Bearer token. Identity is never taken from the request body."""
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHENTICATED",
                "message": "Missing or invalid Authorization header.",
            },
        )
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={
                "code": "UNAUTHENTICATED",
                "message": "Missing or invalid Authorization header.",
            },
        )
    return token


def get_optional_bearer_token(
    authorization: Annotated[str | None, Header()] = None,
) -> str | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None
    token = authorization.split(" ", 1)[1].strip()
    return token or None


def get_current_user(
    token: Annotated[str, Depends(get_bearer_token)],
    settings: SettingsDep,
) -> CurrentUser:
    try:
        return validate_access_token(token, settings=settings)
    except AppError as exc:
        raise _http_from_app_error(exc) from exc


def require_user(
    user: Annotated[CurrentUser, Depends(get_current_user)],
) -> CurrentUser:
    """Any authenticated, non-disabled user."""
    if user.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "ACCOUNT_DISABLED", "message": "This account is disabled."},
        )
    return user


def require_admin(
    user: Annotated[CurrentUser, Depends(require_user)],
) -> CurrentUser:
    try:
        return assert_admin(user)
    except AuthorizationError as exc:
        raise _http_from_app_error(exc) from exc


CurrentUserDep = Annotated[CurrentUser, Depends(get_current_user)]
RequireUserDep = Annotated[CurrentUser, Depends(require_user)]
RequireAdminDep = Annotated[CurrentUser, Depends(require_admin)]


# Re-export for callers that import AuthenticationError from dependencies.
__all__ = [
    "CurrentUserDep",
    "RequireAdminDep",
    "RequireUserDep",
    "SettingsDep",
    "get_app_settings",
    "get_bearer_token",
    "get_current_user",
    "get_optional_bearer_token",
    "require_admin",
    "require_user",
    "AuthenticationError",
]
