"""Authenticated file upload for knowledge storage."""

from fastapi import APIRouter, File, Request, UploadFile

from app.dependencies import RequireUserDep
from app.middleware.rate_limit import RAG_UPLOAD_LIMIT, enforce_rate_limit
from app.schemas.common import ok
from app.services import storage_service
from app.utils.errors import ValidationError

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload")
async def upload_file(
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
    if not file.filename:
        raise ValidationError("filename is required.")
    data = await file.read()
    path = storage_service.store_document_bytes(
        user_id=str(user.id),
        knowledge_base_id="uploads",
        filename=file.filename,
        data=data,
        content_type=file.content_type,
    )
    return ok({"storage_path": path, "filename": file.filename, "bytes": len(data)})
