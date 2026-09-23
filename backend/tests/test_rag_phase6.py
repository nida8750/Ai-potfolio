from app.services.rag_parsing import chunk_text, clean_text, parse_document


def test_parse_and_chunk_keeps_source_metadata() -> None:
    text = parse_document(
        "note.md", b"# LeadFlow\n\nLeadFlow automates lead management with n8n.\n"
    )
    assert "LeadFlow" in text
    chunks = chunk_text(clean_text(text), source="note.md", document_id="doc-1")
    assert chunks
    assert all(c["metadata"]["source"] == "note.md" for c in chunks)
    assert all(c["metadata"]["document_id"] == "doc-1" for c in chunks)
