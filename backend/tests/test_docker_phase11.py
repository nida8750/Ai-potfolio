from pathlib import Path


def test_dockerfile_is_non_root_python312() -> None:
    text = Path("Dockerfile").read_text(encoding="utf-8")
    assert "python:3.12" in text
    assert "useradd" in text or "USER app" in text
    assert "uvicorn" in text
