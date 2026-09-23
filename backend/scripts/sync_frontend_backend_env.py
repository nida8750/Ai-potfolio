"""Align FRONTEND_URL / BACKEND_URL between backend/.env and frontend/.env.local.

Does not invent credentials. Only writes URL keys when they are empty.
"""

from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND_ENV = ROOT / "backend" / ".env"
FRONTEND_ENV = ROOT / "frontend" / ".env.local"

DEFAULTS = {
    "FRONTEND_URL": "http://localhost:43127",
    "BACKEND_URL": "http://127.0.0.1:8000",
    "NEXT_PUBLIC_BACKEND_URL": "http://127.0.0.1:8000",
    "NEXT_PUBLIC_APP_URL": "http://localhost:43127",
}


def _read_lines(path: Path) -> list[str]:
    if not path.exists():
        return []
    return path.read_text(encoding="utf-8").splitlines()


def _value(lines: list[str], key: str) -> str:
    prefix = f"{key}="
    for line in lines:
        if line.strip().startswith(prefix):
            return line.split("=", 1)[1].strip()
    return ""


def _set_if_empty(lines: list[str], key: str, value: str) -> list[str]:
    prefix = f"{key}="
    for index, line in enumerate(lines):
        if line.strip().startswith(prefix):
            current = line.split("=", 1)[1].strip()
            if current:
                return lines
            lines[index] = f"{key}={value}"
            return lines
    if lines and lines[-1] != "":
        lines.append("")
    lines.append(f"{key}={value}")
    return lines


def _write(path: Path, lines: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    backend_lines = _read_lines(BACKEND_ENV)
    frontend_lines = _read_lines(FRONTEND_ENV)

    frontend_url = _value(backend_lines, "FRONTEND_URL") or DEFAULTS["FRONTEND_URL"]
    backend_url = _value(frontend_lines, "BACKEND_URL") or DEFAULTS["BACKEND_URL"]

    backend_lines = _set_if_empty(backend_lines, "FRONTEND_URL", frontend_url)
    frontend_lines = _set_if_empty(frontend_lines, "BACKEND_URL", backend_url)
    frontend_lines = _set_if_empty(
        frontend_lines, "NEXT_PUBLIC_BACKEND_URL", DEFAULTS["NEXT_PUBLIC_BACKEND_URL"]
    )
    frontend_lines = _set_if_empty(
        frontend_lines, "NEXT_PUBLIC_APP_URL", DEFAULTS["NEXT_PUBLIC_APP_URL"]
    )

    _write(BACKEND_ENV, backend_lines)
    _write(FRONTEND_ENV, frontend_lines)
    print("Aligned FRONTEND_URL / BACKEND_URL when those keys were empty.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
