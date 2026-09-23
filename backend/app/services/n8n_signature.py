"""n8n HMAC helpers — matches frontend `lib/n8n/signature.ts`."""

from __future__ import annotations

import hashlib
import hmac
import time


def sign_n8n_payload(secret: str, body: str, timestamp: str) -> str:
    message = f"{timestamp}.{body}".encode()
    return hmac.new(secret.encode("utf-8"), message, hashlib.sha256).hexdigest()


def signatures_match(expected: str, actual: str) -> bool:
    left = expected.encode("utf-8")
    right = actual.encode("utf-8")
    if len(left) != len(right):
        return False
    return hmac.compare_digest(left, right)


def verify_n8n_signature(
    secret: str,
    body: str,
    timestamp: str | None,
    signature: str | None,
    *,
    now_ms: int | None = None,
    max_age_ms: int = 5 * 60 * 1000,
) -> bool:
    if not secret or not timestamp or not signature:
        return False
    try:
        ts = int(timestamp)
    except ValueError:
        return False
    age = abs((now_ms if now_ms is not None else int(time.time() * 1000)) - ts)
    if age > max_age_ms:
        return False
    expected = sign_n8n_payload(secret, body, timestamp)
    return signatures_match(expected, signature)
