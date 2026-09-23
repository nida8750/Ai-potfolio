"""Knowledge / RAG API schemas."""

from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CreateKnowledgeBaseRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)


class SearchKnowledgeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    query: str = Field(min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=10)


class KnowledgeBaseData(BaseModel):
    id: UUID | str
    name: str
    description: str = ""
    owner_id: UUID | str
    status: str
    created_at: str | None = None
    updated_at: str | None = None


class SearchHit(BaseModel):
    content: str
    score: float
    metadata: dict[str, Any]
