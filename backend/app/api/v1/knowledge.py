"""Knowledge base + RAG document API."""

from __future__ import annotations

from fastapi import APIRouter, File, Request, UploadFile

from app.dependencies import RequireUserDep
from app.middleware.rate_limit import (
    RAG_SEARCH_LIMIT,
    RAG_UPLOAD_LIMIT,
    enforce_rate_limit,
)
from app.schemas.common import ok
from app.schemas.knowledge import CreateKnowledgeBaseRequest, SearchKnowledgeRequest
from app.services import rag_service
from app.utils.errors import ValidationError

router = APIRouter(prefix="/knowledge-bases", tags=["knowledge"])


@router.get("")
def list_knowledge_bases(user: RequireUserDep) -> dict:
    rows = rag_service.list_knowledge_bases(owner_id=str(user.id))
    return ok({"knowledge_bases": rows})


@router.post("")
def create_knowledge_base(body: CreateKnowledgeBaseRequest, user: RequireUserDep) -> dict:
    row = rag_service.create_knowledge_base(
        owner_id=str(user.id),
        name=body.name,
        description=body.description,
    )
    return ok(row)


@router.get("/{knowledge_base_id}")
def get_knowledge_base(knowledge_base_id: str, user: RequireUserDep) -> dict:
    kb = rag_service.get_knowledge_base(knowledge_base_id=knowledge_base_id, owner_id=str(user.id))
    docs = rag_service.list_documents(knowledge_base_id=knowledge_base_id, owner_id=str(user.id))
    return ok({"knowledge_base": kb, "documents": docs})


@router.post("/{knowledge_base_id}/documents")
async def upload_document(
    knowledge_base_id: str,
    user: RequireUserDep,
    request: Request,
    file: UploadFile = File(...),
) -> dict:
    enforce_rate_limit(
        request,
        scope=RAG_UPLOAD_LIMIT.key,
        limit=RAG_UPLOAD_LIMIT.limit,
        window_seconds=RAG_UPLOAD_LIMIT.window_seconds,
    )
    data = await file.read()
    if not file.filename:
        raise ValidationError("filename is required.")
    result = rag_service.ingest_document(
        knowledge_base_id=knowledge_base_id,
        owner_id=str(user.id),
        filename=file.filename,
        data=data,
        content_type=file.content_type,
    )
    document = {k: v for k, v in result["document"].items() if k not in {"storage_path"}}
    return ok({"document": document, "chunk_count": result["chunk_count"]})


@router.post("/{knowledge_base_id}/search")
def search_knowledge(
    knowledge_base_id: str,
    body: SearchKnowledgeRequest,
    user: RequireUserDep,
    request: Request,
) -> dict:
    enforce_rate_limit(
        request,
        scope=RAG_SEARCH_LIMIT.key,
        limit=RAG_SEARCH_LIMIT.limit,
        window_seconds=RAG_SEARCH_LIMIT.window_seconds,
    )
    result = rag_service.search_knowledge_base(
        knowledge_base_id=knowledge_base_id,
        owner_id=str(user.id),
        query=body.query,
        top_k=body.top_k,
    )
    return ok(result)
