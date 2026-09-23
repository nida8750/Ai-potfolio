"""Copy or generate INTERNAL_API_KEY in backend/.env and frontend/.env.local.

Never prints the key. Does not overwrite a key that already exists on both sides
unless --force is passed.
"""

from __future__ import annotations

import argparse
import secrets
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND_ENV = ROOT / "backend" / ".env"
FRONTEND_ENV = ROOT / "frontend" / ".env.local"
KEY_NAME = "INTERNAL_API_KEY"


def _read_env(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        name, value = stripped.split("=", 1)
        values[name.strip()] = value.strip()
    return values


def _upsert(path: Path, key: str, value: str) -> None:
    lines: list[str] = []
    found = False
    if path.exists():
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith(f"{key}="):
                lines.append(f"{key}={value}")
                found = True
            else:
                lines.append(line)
    if not found:
        if lines and lines[-1] != "":
            lines.append("")
        lines.append(f"{key}={value}")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _configured(value: str | None) -> bool:
    if not value:
        return False
    return value.strip().lower() not in {"", "changeme", "placeholder", "todo"}


def main() -> int:
    parser = argparse.ArgumentParser(description="Sync INTERNAL_API_KEY without printing it.")
    parser.add_argument(
        "--force", action="store_true", help="Overwrite existing keys on both sides."
    )
    args = parser.parse_args()

    backend = _read_env(BACKEND_ENV)
    frontend = _read_env(FRONTEND_ENV)
    backend_key = backend.get(KEY_NAME, "")
    frontend_key = frontend.get(KEY_NAME, "")

    if (
        _configured(backend_key)
        and _configured(frontend_key)
        and backend_key == frontend_key
        and not args.force
    ):
        print("INTERNAL_API_KEY already matches in backend/.env and frontend/.env.local")
        return 0

    chosen = ""
    if _configured(backend_key) and not args.force:
        chosen = backend_key
    elif _configured(frontend_key) and not args.force:
        chosen = frontend_key
    else:
        chosen = secrets.token_urlsafe(32)

    _upsert(BACKEND_ENV, KEY_NAME, chosen)
    _upsert(FRONTEND_ENV, KEY_NAME, chosen)
    print("INTERNAL_API_KEY written to backend/.env and frontend/.env.local (value not printed)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
