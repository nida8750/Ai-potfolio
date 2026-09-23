"""Current user profile (identity from token only)."""

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.dependencies import RequireUserDep
from app.schemas.common import ok

router = APIRouter(prefix="/users", tags=["users"])


class UpdateMeRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: str | None = Field(default=None, max_length=40)


@router.get("/me")
def get_me(user: RequireUserDep) -> dict:
    return ok(
        {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "status": user.status,
            "avatar_url": user.avatar_url,
            "phone": user.phone,
        }
    )


@router.patch("/me")
def patch_me(body: UpdateMeRequest, user: RequireUserDep) -> dict:
    from app.config import get_settings
    from app.db.supabase import get_supabase_admin
    from app.utils.errors import ServiceUnavailableError

    patch = body.model_dump(exclude_none=True)
    if not patch:
        return get_me(user)
    settings = get_settings()
    if not settings.supabase_configured:
        raise ServiceUnavailableError("Supabase is not configured.")
    result = get_supabase_admin().table("profiles").update(patch).eq("id", str(user.id)).execute()
    first = (result.data or [None])[0]
    row = first if isinstance(first, dict) else {}
    return ok(
        {
            "id": str(user.id),
            "email": row.get("email", user.email),
            "name": row.get("name", user.name),
            "role": user.role,
            "status": user.status,
            "avatar_url": row.get("avatar_url", user.avatar_url),
            "phone": row.get("phone", user.phone),
        }
    )
