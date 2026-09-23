from unittest.mock import patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app
from app.services.auth_service import CurrentUser
from app.services.rag_service import reset_rag_store

client = TestClient(app)


def _user() -> CurrentUser:
    return CurrentUser(
        id=uuid4(),
        email="rag@example.com",
        name="RAG User",
        role="USER",
        status="active",
    )


def setup_function() -> None:
    reset_rag_store()


def test_knowledge_bases_require_auth() -> None:
    assert client.get("/api/v1/knowledge-bases").status_code == 401


def test_files_upload_requires_auth() -> None:
    assert client.post("/api/v1/files/upload").status_code == 401


def test_create_kb_ingest_and_search() -> None:
    user = _user()
    with patch("app.dependencies.validate_access_token", return_value=user):
        created = client.post(
            "/api/v1/knowledge-bases",
            headers={"Authorization": "Bearer t"},
            json={"name": "Docs", "description": "Local notes"},
        )
        assert created.status_code == 200
        kb_id = created.json()["data"]["id"]
        uploaded = client.post(
            f"/api/v1/knowledge-bases/{kb_id}/documents",
            headers={"Authorization": "Bearer t"},
            files={
                "file": (
                    "note.md",
                    b"# InvoiceFlow\nInvoiceFlow automates invoices.\n",
                    "text/markdown",
                )
            },
        )
        assert uploaded.status_code == 200
        assert uploaded.json()["data"]["chunk_count"] >= 1
        searched = client.post(
            f"/api/v1/knowledge-bases/{kb_id}/search",
            headers={"Authorization": "Bearer t"},
            json={"query": "InvoiceFlow invoices", "top_k": 3},
        )
    assert searched.status_code == 200
    body = searched.json()["data"]
    assert "results" in body or "chunks" in body or "matches" in body
    blob = str(body).lower()
    assert "invoiceflow" in blob
