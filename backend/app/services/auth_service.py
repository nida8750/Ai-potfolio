"""Supabase Auth service.

Identity and role always come from a validated access token + profiles row.
Never trust user_id or role from the request body.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Literal
from uuid import UUID

from app.config import Settings, get_settings
from app.db.supabase import (
    SupabaseNotConfiguredError,
    get_supabase_admin,
    get_supabase_anon,
)
from app.utils.errors import (
    AppError,
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    ExternalServiceError,
    ServiceUnavailableError,
    ValidationError,
)

logger = logging.getLogger(__name__)

UserRole = Literal["USER", "ADMIN"]


@dataclass(frozen=True, slots=True)
class CurrentUser:
    id: UUID
    email: str
    name: str
    role: UserRole
    status: str
    avatar_url: str | None = None
    phone: str | None = None

    @property
    def is_admin(self) -> bool:
        return self.role == "ADMIN" and self.status == "active"


@dataclass(frozen=True, slots=True)
class AuthSession:
    access_token: str
    refresh_token: str
    expires_in: int | None = None
    token_type: str = "bearer"


def _require_supabase(settings: Settings | None = None) -> Settings:
    cfg = settings or get_settings()
    if not cfg.supabase_configured:
        raise ServiceUnavailableError(
            "Supabase Auth is not configured. Set SUPABASE_URL, "
            "SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY."
        )
    return cfg


def _auth_error_from_message(message: str) -> Exception:
    lower = message.lower()
    if "already registered" in lower or "already been registered" in lower:
        return ConflictError("An account with this email already exists.", code="EMAIL_TAKEN")
    if "invalid login" in lower or "invalid credentials" in lower:
        return AuthenticationError("Email or password is incorrect.", code="INVALID_CREDENTIALS")
    if "email not confirmed" in lower or "not confirmed" in lower:
        return AuthorizationError("Verify your email before signing in.", code="UNVERIFIED")
    if "token" in lower or "jwt" in lower or "session" in lower:
        return AuthenticationError("Invalid or expired session.", code="INVALID_TOKEN")
    return ExternalServiceError(message or "Authentication provider error.")


def _session_from_supabase(session: Any) -> AuthSession:
    if session is None:
        raise AuthenticationError("No session returned.", code="NO_SESSION")
    access = getattr(session, "access_token", None)
    refresh = getattr(session, "refresh_token", None)
    if not access or not refresh:
        raise AuthenticationError("No session returned.", code="NO_SESSION")
    return AuthSession(
        access_token=access,
        refresh_token=refresh,
        expires_in=getattr(session, "expires_in", None),
        token_type=getattr(session, "token_type", None) or "bearer",
    )


def _profile_row_to_user(row: dict[str, Any]) -> CurrentUser:
    role = row.get("role") or "USER"
    if role not in ("USER", "ADMIN"):
        role = "USER"
    return CurrentUser(
        id=UUID(str(row["id"])),
        email=str(row.get("email") or ""),
        name=str(row.get("name") or ""),
        role=role,  # type: ignore[arg-type]
        status=str(row.get("status") or "active"),
        avatar_url=row.get("avatar_url"),
        phone=row.get("phone"),
    )


def load_profile(user_id: str, *, settings: Settings | None = None) -> CurrentUser:
    """Load profile by auth user id. Role comes from DB, never from the JWT claims alone."""
    cfg = _require_supabase(settings)
    admin = get_supabase_admin(cfg)
    result = (
        admin.table("profiles")
        .select("id,email,name,phone,role,avatar_url,status")
        .eq("id", user_id)
        .limit(1)
        .execute()
    )
    rows = result.data or []
    if not rows:
        raise AuthenticationError("Profile not found for this account.", code="PROFILE_MISSING")
    user = _profile_row_to_user(rows[0])
    if user.status == "disabled":
        raise AuthorizationError("This account is disabled.", code="ACCOUNT_DISABLED")
    return user


def validate_access_token(access_token: str, *, settings: Settings | None = None) -> CurrentUser:
    """Validate a Supabase access token and return the profile-backed user."""
    if not access_token or not access_token.strip():
        raise AuthenticationError("Missing or invalid Authorization header.")

    cfg = _require_supabase(settings)
    try:
        # Prefer anon client + jwt; falls back to admin get_user(jwt).
        client = get_supabase_anon(cfg)
        response = client.auth.get_user(access_token.strip())
    except SupabaseNotConfiguredError as exc:
        raise ServiceUnavailableError(str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        logger.info("token_validation_failed error_category=auth")
        raise AuthenticationError("Invalid or expired session.", code="INVALID_TOKEN") from exc

    user = getattr(response, "user", None)
    if user is None and isinstance(response, dict):
        user = response.get("user")
    if user is None:
        raise AuthenticationError("Invalid or expired session.", code="INVALID_TOKEN")

    user_id = getattr(user, "id", None) or (user.get("id") if isinstance(user, dict) else None)
    if not user_id:
        raise AuthenticationError("Invalid or expired session.", code="INVALID_TOKEN")

    return load_profile(str(user_id), settings=cfg)


def signup(
    *,
    email: str,
    password: str,
    name: str,
    phone: str | None = None,
    settings: Settings | None = None,
) -> tuple[UUID, str, bool, AuthSession | None]:
    cfg = _require_supabase(settings)
    client = get_supabase_anon(cfg)
    try:
        response = client.auth.sign_up(
            {
                "email": email.strip().lower(),
                "password": password,
                "options": {
                    "data": {
                        "name": name.strip(),
                        "phone": phone or "",
                    }
                },
            }
        )
    except Exception as exc:  # noqa: BLE001
        raise _auth_error_from_message(str(exc)) from exc

    error = getattr(response, "error", None)
    if error:
        raise _auth_error_from_message(getattr(error, "message", str(error)))

    auth_user = getattr(response, "user", None)
    if auth_user is None:
        raise ExternalServiceError("Sign-up did not return a user.")

    raw_id = getattr(auth_user, "id", None)
    if raw_id is None and isinstance(auth_user, dict):
        raw_id = auth_user.get("id")
    if not raw_id:
        raise ExternalServiceError("Sign-up did not return a user.")

    user_id = UUID(str(raw_id))
    user_email = getattr(auth_user, "email", None)
    if user_email is None and isinstance(auth_user, dict):
        user_email = auth_user.get("email")
    user_email = str(user_email or email.strip().lower())
    session_obj = getattr(response, "session", None)
    session = _session_from_supabase(session_obj) if session_obj else None
    confirmation_required = session is None
    return user_id, user_email, confirmation_required, session


def login(
    *,
    email: str,
    password: str,
    settings: Settings | None = None,
) -> tuple[CurrentUser, AuthSession]:
    cfg = _require_supabase(settings)
    client = get_supabase_anon(cfg)
    try:
        response = client.auth.sign_in_with_password(
            {"email": email.strip().lower(), "password": password}
        )
    except Exception as exc:  # noqa: BLE001
        raise _auth_error_from_message(str(exc)) from exc

    error = getattr(response, "error", None)
    if error:
        raise _auth_error_from_message(getattr(error, "message", str(error)))

    session = _session_from_supabase(getattr(response, "session", None))
    auth_user = getattr(response, "user", None)
    if auth_user is None:
        raise AuthenticationError("Email or password is incorrect.", code="INVALID_CREDENTIALS")
    user_id = str(getattr(auth_user, "id", None))
    profile = load_profile(user_id, settings=cfg)
    return profile, session


def logout(access_token: str, *, settings: Settings | None = None) -> None:
    """Best-effort logout. Clients must discard tokens even if this is a no-op."""
    cfg = _require_supabase(settings)
    try:
        # Validate the token first so anonymous callers cannot spam sign-out.
        user = validate_access_token(access_token, settings=cfg)
        admin = get_supabase_admin(cfg)
        # Revoke refresh tokens for this user when the admin API is available.
        admin_auth = getattr(admin.auth, "admin", None)
        if admin_auth is not None and hasattr(admin_auth, "sign_out"):
            admin_auth.sign_out(str(user.id))
    except AuthenticationError:
        raise
    except AppError:
        raise
    except Exception:  # noqa: BLE001
        # Do not fail the client logout path for provider quirks.
        logger.info("logout_best_effort_failed error_category=auth")


def refresh_session(
    refresh_token: str, *, settings: Settings | None = None
) -> tuple[CurrentUser, AuthSession]:
    cfg = _require_supabase(settings)
    client = get_supabase_anon(cfg)
    try:
        response = client.auth.refresh_session(refresh_token)
    except Exception as exc:  # noqa: BLE001
        raise AuthenticationError(
            "Invalid or expired refresh token.", code="INVALID_TOKEN"
        ) from exc

    session = _session_from_supabase(getattr(response, "session", None))
    user = validate_access_token(session.access_token, settings=cfg)
    return user, session


def forgot_password(
    email: str, *, redirect_to: str | None = None, settings: Settings | None = None
) -> None:
    cfg = _require_supabase(settings)
    client = get_supabase_anon(cfg)
    options: dict[str, Any] = {}
    if redirect_to:
        options["redirect_to"] = redirect_to
    try:
        client.auth.reset_password_for_email(email.strip().lower(), options or None)
    except Exception as exc:  # noqa: BLE001
        message = str(exc).lower()
        # Do not leak whether the email exists.
        if "user not found" in message or "signup_disabled" in message:
            return
        raise ExternalServiceError("Could not start password reset.") from exc


def verify_email(*, email: str, code: str, settings: Settings | None = None) -> None:
    cfg = _require_supabase(settings)
    client = get_supabase_anon(cfg)
    try:
        response = client.auth.verify_otp(
            {"email": email.strip().lower(), "token": code, "type": "signup"}
        )
    except Exception as exc:  # noqa: BLE001
        raise ValidationError("Verification code is invalid.", code="INVALID_CODE") from exc
    error = getattr(response, "error", None)
    if error:
        raise ValidationError("Verification code is invalid.", code="INVALID_CODE")


def reset_password(
    *,
    email: str,
    code: str,
    password: str,
    settings: Settings | None = None,
) -> None:
    cfg = _require_supabase(settings)
    client = get_supabase_anon(cfg)
    try:
        verify = client.auth.verify_otp(
            {"email": email.strip().lower(), "token": code, "type": "recovery"}
        )
    except Exception as exc:  # noqa: BLE001
        raise ValidationError("Verification code is invalid.", code="INVALID_CODE") from exc
    if getattr(verify, "error", None):
        raise ValidationError("Verification code is invalid.", code="INVALID_CODE")
    try:
        update = client.auth.update_user({"password": password})
    except Exception as exc:  # noqa: BLE001
        raise ExternalServiceError("Could not update password.") from exc
    if getattr(update, "error", None):
        raise ExternalServiceError("Could not update password.")


def assert_admin(user: CurrentUser) -> CurrentUser:
    if not user.is_admin:
        raise AuthorizationError("Admin access required.")
    return user
