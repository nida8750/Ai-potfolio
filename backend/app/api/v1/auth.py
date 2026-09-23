"""Auth API: session validation and Supabase Auth operations."""

from __future__ import annotations

from fastapi import APIRouter, Depends, Request

from app.dependencies import RequireUserDep, SettingsDep, get_optional_bearer_token
from app.middleware.rate_limit import AUTH_LIMIT, enforce_rate_limit
from app.schemas.auth import (
    AuthSessionData,
    AuthUserData,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponseData,
    RefreshRequest,
    ResetPasswordRequest,
    SignupRequest,
    SignupResponseData,
    VerifyEmailRequest,
)
from app.schemas.common import ok
from app.services import auth_service
from app.services.auth_service import AuthSession, CurrentUser

router = APIRouter(prefix="/auth", tags=["auth"])


def _user_data(user: CurrentUser) -> AuthUserData:
    return AuthUserData(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        status=user.status,
        avatar_url=user.avatar_url,
        phone=user.phone,
    )


def _session_data(session: AuthSession) -> AuthSessionData:
    return AuthSessionData(
        access_token=session.access_token,
        refresh_token=session.refresh_token,
        expires_in=session.expires_in,
        token_type=session.token_type,
    )


@router.get("/me")
def auth_me(user: RequireUserDep) -> dict:
    """Current user from validated Bearer token + profiles row."""
    return ok(_user_data(user).model_dump(mode="json"))


@router.post("/signup", response_model=None)
def auth_signup(request: Request, body: SignupRequest, settings: SettingsDep) -> dict:
    enforce_rate_limit(
        request,
        scope=AUTH_LIMIT.key,
        limit=AUTH_LIMIT.limit,
        window_seconds=AUTH_LIMIT.window_seconds,
    )
    user_id, email, confirmation_required, session = auth_service.signup(
        email=str(body.email),
        password=body.password,
        name=body.name,
        phone=body.phone,
        settings=settings,
    )
    data = SignupResponseData(
        user_id=user_id,
        email=email,
        confirmation_required=confirmation_required,
        session=_session_data(session) if session else None,
    )
    return ok(data.model_dump(mode="json"))


@router.post("/login", response_model=None)
def auth_login(request: Request, body: LoginRequest, settings: SettingsDep) -> dict:
    enforce_rate_limit(
        request,
        scope=AUTH_LIMIT.key,
        limit=AUTH_LIMIT.limit,
        window_seconds=AUTH_LIMIT.window_seconds,
    )
    user, session = auth_service.login(
        email=str(body.email),
        password=body.password,
        settings=settings,
    )
    data = LoginResponseData(user=_user_data(user), session=_session_data(session))
    return ok(data.model_dump(mode="json"))


@router.post("/logout", response_model=None)
def auth_logout(
    settings: SettingsDep,
    token: str | None = Depends(get_optional_bearer_token),
) -> dict:
    """Best-effort server logout. Clients must discard tokens regardless."""
    if token:
        auth_service.logout(token, settings=settings)
    return ok({"logged_out": True})


@router.post("/refresh", response_model=None)
def auth_refresh(body: RefreshRequest, settings: SettingsDep) -> dict:
    user, session = auth_service.refresh_session(body.refresh_token, settings=settings)
    data = LoginResponseData(user=_user_data(user), session=_session_data(session))
    return ok(data.model_dump(mode="json"))


@router.post("/forgot-password", response_model=None)
def auth_forgot_password(
    request: Request,
    body: ForgotPasswordRequest,
    settings: SettingsDep,
) -> dict:
    enforce_rate_limit(
        request,
        scope=AUTH_LIMIT.key,
        limit=AUTH_LIMIT.limit,
        window_seconds=AUTH_LIMIT.window_seconds,
    )
    redirect_to = f"{settings.frontend_url.rstrip('/')}/reset-password"
    auth_service.forgot_password(str(body.email), redirect_to=redirect_to, settings=settings)
    return ok({"sent": True})


@router.post("/reset-password", response_model=None)
def auth_reset_password(body: ResetPasswordRequest, settings: SettingsDep) -> dict:
    auth_service.reset_password(
        email=str(body.email),
        code=body.code,
        password=body.password,
        settings=settings,
    )
    return ok({"reset": True})


@router.post("/verify-email", response_model=None)
def auth_verify_email(body: VerifyEmailRequest, settings: SettingsDep) -> dict:
    auth_service.verify_email(email=str(body.email), code=body.code, settings=settings)
    return ok({"verified": True})
