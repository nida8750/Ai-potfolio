"""Shared response helpers matching the frontend API envelope."""

from typing import Any, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class Envelope(BaseModel):
    model_config = ConfigDict(extra="forbid")

    success: bool


def ok(data: Any) -> dict[str, Any]:
    return {"success": True, "data": data}


def fail(code: str, message: str) -> dict[str, Any]:
    return {"success": False, "error": {"code": code, "message": message}}
