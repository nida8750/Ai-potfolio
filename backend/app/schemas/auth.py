"""Auth request/response schemas. Identity is never accepted from the body."""

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class SignupRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: str = Field(min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=40)


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class RefreshRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    refresh_token: str = Field(min_length=1)


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    code: str = Field(min_length=4, max_length=64)
    password: str = Field(min_length=8, max_length=128)


class VerifyEmailRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: EmailStr
    code: str = Field(min_length=4, max_length=64)


class AuthSessionData(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int | None = None
    token_type: str = "bearer"


class AuthUserData(BaseModel):
    id: UUID
    email: str
    name: str
    role: Literal["USER", "ADMIN"]
    status: str
    avatar_url: str | None = None
    phone: str | None = None


class SignupResponseData(BaseModel):
    user_id: UUID
    email: str
    confirmation_required: bool
    session: AuthSessionData | None = None


class LoginResponseData(BaseModel):
    user: AuthUserData
    session: AuthSessionData
