#!/usr/bin/env python3
"""Canonical Testimony Manifest Generator & Hasher for Civic Deliberation Allocator.

Constructs canonical pipe-delimited testimony manifests and computes deterministic
SHA-256 batch digests for pre-lock commitment verification.
"""

from __future__ import annotations

import hashlib
import json
import sys
from typing import Any, Dict, List


def has_forbidden_control_characters(text: str) -> bool:
    """Detect pipe delimiters, carriage returns, newlines, tabs, and ASCII control chars."""
    for char in text:
        code = ord(char)
        if char in ("|", "\r", "\n", "\t") or code < 32 or code == 127:
            return True
    return False


def validate_testimony_attribute(field_name: str, value: str) -> str:
    """Ensure an attribute string is clean, trimmed, and contains no delimiter collisions."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"ERR_EMPTY_{field_name.upper()}: Value must be non-empty string")
    if has_forbidden_control_characters(value):
        raise ValueError(f"ERR_FORBIDDEN_CHARS_{field_name.upper()}: Contains forbidden control or delimiter characters")
    if value.strip() != value:
        raise ValueError(f"ERR_PADDING_{field_name.upper()}: Untrimmed whitespace detected")
    return value


def format_manifest_entry(index: int, testimony_id: str, url: str, digest: str) -> str:
    """Format a single canonical manifest entry with exact pipe delimiters and lowercase digest."""
    if not isinstance(index, int) or index < 0:
        raise ValueError(f"ERR_INVALID_INDEX: Expected non-negative integer, got {index}")

    clean_id = validate_testimony_attribute("testimony_id", testimony_id)
    if len(clean_id) > 128:
        raise ValueError(f"ERR_ID_TOO_LONG: Identifier exceeds 128 character ceiling ({len(clean_id)})")

    clean_url = validate_testimony_attribute("url", url)
    if not (clean_url.startswith("http://") or clean_url.startswith("https://")) or " " in clean_url:
        raise ValueError(f"ERR_INVALID_URL_SCHEME: URL must be valid HTTP/HTTPS without spaces, got '{clean_url}'")

    clean_digest = validate_testimony_attribute("digest", digest).lower()
    if len(clean_digest) != 64 or not all(c in "0123456789abcdef" for c in clean_digest):
        raise ValueError(f"ERR_INVALID_DIGEST: Digest must be 64-character hexadecimal SHA-256, got '{clean_digest}'")

    return f"{index}|{clean_id}|{clean_url}|{clean_digest}\n"


def build_canonical_manifest(testimonies: List[Dict[str, Any]]) -> str:
    """Assemble the canonical manifest text in registration sequence."""
    entries: List[str] = []
    for idx, item in enumerate(testimonies):
        tid = str(item.get("testimony_id") or item.get("id") or item.get("external_id") or "")
        url = str(item.get("url") or "")
        digest = str(item.get("digest") or "")
        entries.append(format_manifest_entry(idx, tid, url, digest))
    return "".join(entries)


def compute_manifest_digest(testimonies: List[Dict[str, Any]]) -> str:
    """Compute 64-character hexadecimal SHA-256 digest of the canonical manifest string."""
    canonical_text = build_canonical_manifest(testimonies)
    return hashlib.sha256(canonical_text.encode("utf-8")).hexdigest().lower()


def compute_text_sha256(content: str) -> str:
    """Utility helper to calculate lowercase hex SHA-256 of arbitrary UTF-8 text."""
    return hashlib.sha256(content.encode("utf-8")).hexdigest().lower()


def main() -> None:
    """Command-line interface to build and hash testimony manifests."""
    if len(sys.argv) > 1 and sys.argv[1] in ("-h", "--help"):
        print("Usage: python testimony_manifest.py [input_json_file]")
        print("Accepts JSON array of testimony objects and outputs canonical manifest and SHA-256 digest.")
        sys.exit(0)

    if len(sys.argv) > 1:
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)

    if not isinstance(data, list):
        print("Error: Input JSON must be an array of testimony records.", file=sys.stderr)
        sys.exit(1)

    try:
        manifest_text = build_canonical_manifest(data)
        manifest_hash = compute_manifest_digest(data)
        print("--- CANONICAL MANIFEST ---")
        print(manifest_text, end="")
        print("--- MANIFEST SHA-256 DIGEST ---")
        print(manifest_hash)
    except ValueError as err:
        print(f"Validation Error: {err}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
