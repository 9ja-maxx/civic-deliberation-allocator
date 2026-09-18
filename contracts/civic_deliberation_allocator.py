# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }
"""Civic Deliberation Allocator — Intelligent Contract for Citizen Assembly Sortition.

Replaces centralized administrative gatekeeping in public inquiries and citizen hearings
with trustless web evidence verification, multi-metric Equivalence Principle consensus,
deterministic coverage-first sortition, and bonded citizen dispute arbitration.
"""

from genlayer import *

from datetime import datetime, timezone
import hashlib
import json
import typing


# ==============================================================================
# 1. Configuration & Policy Constraints
# ==============================================================================

MAX_TESTIMONIES: int = 12
MIN_DELEGATE_SLOTS: int = 1
MAX_DELEGATE_SLOTS: int = 6
MIN_THEMATIC_CLUSTERS: int = 1
MAX_THEMATIC_CLUSTERS: int = 6
MAX_DELEGATES_PER_CLUSTER: int = 2

# 6-State Formal Lifecycle
STATE_ENROLLING: str = "ENROLLING"
STATE_MANIFEST_LOCKED: str = "MANIFEST_LOCKED"
STATE_THEMATIC_CONSENSUS: str = "THEMATIC_CONSENSUS"
STATE_SORTITION_ALLOCATED: str = "SORTITION_ALLOCATED"
STATE_CONTESTATION_OPEN: str = "CONTESTATION_OPEN"
STATE_SOVEREIGN_RATIFIED: str = "SOVEREIGN_RATIFIED"
STATE_ANNULLED_PRELOCK: str = "ANNULLED_PRELOCK"

# Contestation / Dispute Categories
CHALLENGE_PROVENANCE_MISMATCH: str = "PROVENANCE_MISMATCH"
CHALLENGE_DUPLICATE_COLLUSION: str = "DUPLICATE_COLLUSION"

# Dispute Verdict Statuses
STATUS_PENDING: str = "PENDING"
STATUS_ACCEPTED: str = "ACCEPTED"
STATUS_REJECTED: str = "REJECTED"

# Standardized Sortition Rationale Codes
REASON_PRIMARY_CLUSTER_DELEGATE: str = "PRIMARY_CLUSTER_DELEGATE"
REASON_SECONDARY_CLUSTER_DEPTH: str = "SECONDARY_CLUSTER_DEPTH"
REASON_UNSELECTED_CLUSTER_CAP: str = "CLUSTER_CAP_REACHED"
REASON_UNSELECTED_SLOT_CAPACITY: str = "SLOT_CAPACITY_LIMIT"
REASON_UNSELECTED_LOWER_RELEVANCE: str = "LOWER_RELEVANCE_RANKING"
REASON_UNSELECTED_SEMANTIC_DUPLICATE: str = "DUPLICATE_ASTROTURF"
REASON_UNSELECTED_PROVENANCE_DISQUALIFIED: str = "PROVENANCE_DISQUALIFIED"
REASON_UNSELECTED_IRRELEVANT: str = "OUT_OF_SCOPE_IRRELEVANT"


# ==============================================================================
# 2. Cryptographic Validation & Address Normalization Helpers
# ==============================================================================

def _canonicalize_address(addr: typing.Any) -> str:
    """Normalize any address representation into a 42-char lowercase hex string."""
    if hasattr(addr, "as_hex"):
        return str(addr.as_hex).lower()
    if isinstance(addr, str):
        clean = addr.strip().lower()
        return clean if clean.startswith("0x") else "0x" + clean
    if isinstance(addr, int):
        return "0x" + f"{addr:040x}"
    if isinstance(addr, (bytes, bytearray)):
        return "0x" + addr.hex().lower()
    return str(addr).lower()


def _is_valid_hex_address(addr: str) -> bool:
    """Ensure address is an authentic 42-char 0x-prefixed hexadecimal string."""
    if not isinstance(addr, str) or len(addr) != 42 or not addr.startswith("0x"):
        return False
    return all(c in "0123456789abcdefABCDEF" for c in addr[2:])


def _resolve_transaction_caller() -> str:
    """Obtain validated transaction sender from GenVM execution context. Fails closed."""
    try:
        caller = gl.message.sender_address
    except Exception as err:
        raise gl.vm.UserError(f"ERR_CALLER_UNAVAILABLE: Execution context sender unavailable: {err}")

    normalized = _canonicalize_address(caller)
    if not _is_valid_hex_address(normalized) or normalized == "0x0000000000000000000000000000000000000000":
        raise gl.vm.UserError("ERR_INVALID_CALLER: Caller address is invalid, malformed, or zero address")
    return normalized


def _current_timestamp_utc() -> int:
    """Deterministic transaction execution timestamp in UTC seconds."""
    return int(datetime.now(timezone.utc).timestamp())


def _has_forbidden_delimiters(val: str) -> bool:
    """Reject pipe delimiters, CR, LF, tabs, and ASCII control characters."""
    for char in val:
        code = ord(char)
        if char in ("|", "\r", "\n", "\t") or code < 32 or code == 127:
            return True
    return False


def _validate_sha256_digest(digest: str) -> bool:
    """Validate 64-character lowercase/uppercase hex SHA-256 digest without delimiters."""
    if not isinstance(digest, str) or _has_forbidden_delimiters(digest):
        return False
    clean = digest.strip()
    return len(clean) == 64 and clean == digest and all(c in "0123456789abcdefABCDEF" for c in clean)


def _validate_http_url(url: str) -> bool:
    """Verify that URL is an explicit public HTTP or HTTPS locator."""
    if not isinstance(url, str) or not url or _has_forbidden_delimiters(url):
        return False
    if " " in url or url.strip() != url:
        return False
    return url.startswith("http://") or url.startswith("https://")


def _validate_testimony_identifier(ident: str) -> bool:
    """Validate testimony ID: 1-128 chars, no pipe or control chars, clean trim."""
    if not isinstance(ident, str) or not ident or _has_forbidden_delimiters(ident):
        return False
    return 1 <= len(ident) <= 128 and ident.strip() == ident


def _compute_enrollment_receipt(docket_id: int, testimony_id: str, url: str, digest: str, registrar: str) -> str:
    """Cryptographically bind admitted record to docket, source, content digest, and registrar."""
    payload = f"{docket_id}|{testimony_id}|{url}|{digest.lower()}|{registrar.lower()}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().lower()


def _format_manifest_line(index: int, testimony_id: str, url: str, digest: str) -> str:
    """Construct a canonical pipe-delimited manifest record."""
    return f"{index}|{testimony_id}|{url}|{digest.lower()}\n"


def _build_canonical_manifest_string(testimonies: list[dict]) -> str:
    """Assemble the exact canonical manifest string in registration sequence."""
    lines = [
        _format_manifest_line(i, str(t["testimony_id"]), str(t["url"]), str(t["digest"]).lower())
        for i, t in enumerate(testimonies)
    ]
    return "".join(lines)


def _compute_manifest_hash(testimonies: list[dict]) -> str:
    """Generate SHA-256 hash of the canonical manifest string."""
    manifest_data = _build_canonical_manifest_string(testimonies)
    return hashlib.sha256(manifest_data.encode("utf-8")).hexdigest().lower()


def _sortition_tiebreak_key(candidate: dict) -> tuple:
    """Deterministic, bias-free candidate tie-breaker:
    1. Highest relevance score first (-relevance_score)
    2. Ascending SHA-256 digest lexicographically
    3. Ascending unique testimony ID
    """
    return (
        -int(candidate.get("relevance_score", 0)),
        str(candidate.get("digest", "")).lower(),
        str(candidate.get("testimony_id", "")),
    )


def _encode_json_compact(value: typing.Any) -> str:
    """Deterministic JSON serialization with sorted keys and minimal whitespace."""
    return json.dumps(value, sort_keys=True, separators=(",", ":"))


# ==============================================================================
# 3. Deterministic Coverage-First Sortition Policy
# ==============================================================================

def _execute_sortition_algorithm(
    slot_count: int,
    testimonies: list[dict],
    clusters: list[dict],
) -> list[dict]:
    """Execute mathematical sortition to maximize viewpoint diversity across clusters.

    Pass 1: Unique cluster coverage (at most 1 delegate per thematic cluster).
    Pass 2: Cluster depth fill (at most 2 delegates per cluster if slots remain).
    Pass 3: Assign standardized non-selection reason codes.
    """
    # Reset any prior sortition flags
    for t in testimonies:
        t["selected"] = False
        t["selection_rank"] = 0
        t["reason_code"] = ""
        t["rationale"] = ""

    cluster_index = {c["cluster_id"]: c for c in clusters}
    testimonies_by_cluster: dict[int, list[dict]] = {cid: [] for cid in cluster_index}

    for t in testimonies:
        if t.get("eligible", True) and int(t.get("cluster_id", 0)) > 0:
            cid = int(t["cluster_id"])
            if cid in testimonies_by_cluster:
                testimonies_by_cluster[cid].append(t)

    selected_delegates: list[dict] = []
    cluster_delegate_tally: dict[int, int] = {cid: 0 for cid in cluster_index}

    # PASS 1: Broadest viewpoint representation across distinct clusters
    first_round_candidates: list[dict] = []
    for cid, pool in testimonies_by_cluster.items():
        if not pool:
            continue
        # Filter out duplicates when possible
        clean_pool = [t for t in pool if not t.get("is_duplicate", False)]
        effective_pool = clean_pool if clean_pool else pool
        sorted_pool = sorted(effective_pool, key=_sortition_tiebreak_key)
        first_round_candidates.append(sorted_pool[0])

    ranked_round1 = sorted(first_round_candidates, key=_sortition_tiebreak_key)
    for t in ranked_round1:
        if len(selected_delegates) >= slot_count:
            break
        t["selected"] = True
        selected_delegates.append(t)
        t["selection_rank"] = len(selected_delegates)
        t["reason_code"] = REASON_PRIMARY_CLUSTER_DELEGATE
        cluster_info = cluster_index.get(t["cluster_id"], {})
        label = cluster_info.get("label", f"Cluster {t['cluster_id']}")
        t["rationale"] = f"Primary viewpoint delegate for {label} (Cluster {t['cluster_id']})"
        cluster_delegate_tally[t["cluster_id"]] += 1

    # PASS 2: Fill remaining slots with secondary depth (max 2 per cluster)
    if len(selected_delegates) < slot_count:
        second_round_pool: list[dict] = []
        for cid, pool in testimonies_by_cluster.items():
            if cluster_delegate_tally[cid] < MAX_DELEGATES_PER_CLUSTER:
                for t in pool:
                    if not t["selected"] and not t.get("is_duplicate", False):
                        second_round_pool.append(t)

        ranked_round2 = sorted(second_round_pool, key=_sortition_tiebreak_key)
        for t in ranked_round2:
            if len(selected_delegates) >= slot_count:
                break
            if cluster_delegate_tally[t["cluster_id"]] < MAX_DELEGATES_PER_CLUSTER:
                t["selected"] = True
                selected_delegates.append(t)
                t["selection_rank"] = len(selected_delegates)
                t["reason_code"] = REASON_SECONDARY_CLUSTER_DEPTH
                cluster_info = cluster_index.get(t["cluster_id"], {})
                label = cluster_info.get("label", f"Cluster {t['cluster_id']}")
                t["rationale"] = f"Secondary depth delegate for {label} (Cluster {t['cluster_id']})"
                cluster_delegate_tally[t["cluster_id"]] += 1

    # PASS 3: Assign normalized reason codes to unselected testimonies
    for t in testimonies:
        if t["selected"]:
            continue
        if not t.get("eligible", True):
            ex_reason = t.get("exclusion_reason")
            if ex_reason == REASON_UNSELECTED_PROVENANCE_DISQUALIFIED:
                t["reason_code"] = REASON_UNSELECTED_PROVENANCE_DISQUALIFIED
                t["rationale"] = "Disqualified: source content digest mismatch with committed record"
            elif ex_reason == REASON_UNSELECTED_SEMANTIC_DUPLICATE:
                t["reason_code"] = REASON_UNSELECTED_SEMANTIC_DUPLICATE
                t["rationale"] = f"Disqualified: verified semantic duplicate of {t.get('duplicate_of_id', 'earlier submission')}"
            else:
                t["reason_code"] = REASON_UNSELECTED_IRRELEVANT
                t["rationale"] = "Testimony evaluated as out of scope or irrelevant to charter"
        elif int(t.get("cluster_id", 0)) == 0:
            t["reason_code"] = REASON_UNSELECTED_IRRELEVANT
            t["rationale"] = "Testimony evaluated as out of scope or irrelevant to charter"
        elif t.get("is_duplicate", False):
            t["reason_code"] = REASON_UNSELECTED_SEMANTIC_DUPLICATE
            t["rationale"] = f"Identified as near-duplicate of {t.get('duplicate_of_id', '')}"
        elif cluster_delegate_tally.get(int(t.get("cluster_id", 0)), 0) >= MAX_DELEGATES_PER_CLUSTER:
            t["reason_code"] = REASON_UNSELECTED_CLUSTER_CAP
            t["rationale"] = f"Cluster {t['cluster_id']} reached maximum delegate capacity of {MAX_DELEGATES_PER_CLUSTER}"
        elif len(selected_delegates) >= slot_count:
            t["reason_code"] = REASON_UNSELECTED_SLOT_CAPACITY
            t["rationale"] = "Unselected: docket slot capacity reached with higher-ranked representatives"
        else:
            t["reason_code"] = REASON_UNSELECTED_LOWER_RELEVANCE
            t["rationale"] = "Unselected: lower relative relevance score or tie-break ranking"

    return selected_delegates


# ==============================================================================
# 4. CivicDeliberationAllocator Intelligent Contract
# ==============================================================================

class CivicDeliberationAllocator(gl.Contract):
    """GenLayer Intelligent Contract orchestrating transparent citizen assembly sortition."""

    docket_count: u256
    dockets: TreeMap[u256, str]

    def __init__(self):
        self.docket_count = u256(0)
        self.dockets = TreeMap()

    def _retrieve_docket(self, docket_id: int) -> dict:
        """Load and deserialize docket state from persistent storage."""
        key = u256(docket_id)
        if key not in self.dockets:
            raise gl.vm.UserError(f"ERR_DOCKET_NOT_FOUND: Civic docket {docket_id} does not exist")
        return json.loads(self.dockets[key])

    def _persist_docket(self, docket_id: int, docket: dict) -> None:
        """Serialize and persist updated docket state."""
        key = u256(docket_id)
        self.dockets[key] = json.dumps(docket)

    @gl.public.write
    def initialize_docket(
        self,
        proposal_url: str,
        proposal_digest: str,
        expected_manifest_digest: str,
        slot_count: u256,
        enrollment_deadline: u256,
        contestation_deadline: u256,
    ) -> u256:
        """Initialize a new citizen assembly deliberation docket in the ENROLLING state."""
        if not _validate_http_url(proposal_url):
            raise gl.vm.UserError("ERR_INVALID_PROPOSAL_URL: Proposal charter must be a valid public HTTP/HTTPS URL")
        if not _validate_sha256_digest(proposal_digest):
            raise gl.vm.UserError("ERR_INVALID_PROPOSAL_DIGEST: Proposal digest must be 64-char hexadecimal SHA-256")
        if not _validate_sha256_digest(expected_manifest_digest):
            raise gl.vm.UserError("ERR_INVALID_MANIFEST_DIGEST: Expected manifest digest must be 64-char hexadecimal SHA-256")
        if not (MIN_DELEGATE_SLOTS <= int(slot_count) <= MAX_DELEGATE_SLOTS):
            raise gl.vm.UserError(
                f"ERR_INVALID_SLOT_COUNT: Delegate slot capacity must be between {MIN_DELEGATE_SLOTS} and {MAX_DELEGATE_SLOTS}"
            )

        now = _current_timestamp_utc()
        if int(enrollment_deadline) <= now:
            raise gl.vm.UserError(
                f"ERR_PAST_DEADLINE: Enrollment deadline ({enrollment_deadline}) must be strictly in the future (> {now})"
            )
        if int(contestation_deadline) <= int(enrollment_deadline):
            raise gl.vm.UserError(
                f"ERR_INVALID_SEQUENCE: Contestation deadline ({contestation_deadline}) must succeed enrollment deadline ({enrollment_deadline})"
            )

        organizer = _resolve_transaction_caller()
        self.docket_count = u256(int(self.docket_count) + 1)
        d_id = int(self.docket_count)

        docket_state = {
            "id": d_id,
            "organizer": organizer,
            "admission_authority": organizer,
            "proposal_url": proposal_url.strip(),
            "proposal_digest": proposal_digest.strip().lower(),
            "expected_manifest_digest": expected_manifest_digest.strip().lower(),
            "computed_manifest_digest": "",
            "slot_count": int(slot_count),
            "enrollment_deadline": int(enrollment_deadline),
            "contestation_deadline": int(contestation_deadline),
            "state": STATE_ENROLLING,
            "revision": 0,
            "accepted_contestation_count": 0,
            "testimonies": [],
            "clusters": [],
            "contestations": [],
            "contestation_keys": [],
            "annulment_reason": "",
        }

        self._persist_docket(d_id, docket_state)
        return u256(d_id)


    @gl.public.write
    def enroll_testimony(
        self,
        docket_id: u256,
        testimony_id: str,
        url: str,
        digest: str,
    ) -> u256:
        """Enroll an authenticated citizen testimony into an open deliberative docket batch."""
        docket = self._retrieve_docket(int(docket_id))
        if docket["state"] != STATE_ENROLLING:
            raise gl.vm.UserError(f"ERR_INVALID_LIFECYCLE_STATE: Docket is in state {docket['state']}, expected ENROLLING")

        now = _current_timestamp_utc()
        if now >= docket["enrollment_deadline"]:
            raise gl.vm.UserError(
                f"ERR_ENROLLMENT_CLOSED: Timestamp ({now}) is at or past enrollment deadline ({docket['enrollment_deadline']})"
            )

        caller = _resolve_transaction_caller()
        if caller != docket["admission_authority"]:
            raise gl.vm.UserError(
                f"ERR_UNAUTHORIZED_REGISTRATION: Caller {caller} is not the authorized admission authority ({docket['admission_authority']})"
            )

        if not _validate_testimony_identifier(testimony_id):
            raise gl.vm.UserError("ERR_INVALID_TESTIMONY_ID: ID must be 1-128 chars without delimiters or control characters")
        if not _validate_http_url(url):
            raise gl.vm.UserError("ERR_INVALID_TESTIMONY_URL: URL must start with http:// or https:// without spaces or delimiters")
        if not _validate_sha256_digest(digest):
            raise gl.vm.UserError("ERR_INVALID_TESTIMONY_DIGEST: Digest must be 64-char hexadecimal SHA-256")

        clean_id = testimony_id.strip()
        clean_url = url.strip()
        clean_digest = digest.strip().lower()

        if len(docket["testimonies"]) >= MAX_TESTIMONIES:
            raise gl.vm.UserError(f"ERR_DOCKET_CAPACITY_REACHED: Maximum {MAX_TESTIMONIES} testimonies permitted per docket")

        # Exact deduplication checks
        for existing in docket["testimonies"]:
            if existing["testimony_id"] == clean_id:
                raise gl.vm.UserError(f"ERR_DUPLICATE_ID: Testimony ID '{clean_id}' is already enrolled in this docket")
            if existing["url"] == clean_url:
                raise gl.vm.UserError(f"ERR_DUPLICATE_URL: Testimony URL '{clean_url}' is already enrolled in this docket")
            if existing["digest"] == clean_digest:
                raise gl.vm.UserError(f"ERR_DUPLICATE_DIGEST: Content digest '{clean_digest}' is already enrolled in this docket")

        idx = len(docket["testimonies"])
        receipt = _compute_enrollment_receipt(int(docket_id), clean_id, clean_url, clean_digest, caller)

        record = {
            "index": idx,
            "testimony_id": clean_id,
            "url": clean_url,
            "digest": clean_digest,
            "registrar": caller,
            "admission_authority": docket["admission_authority"],
            "enrollment_receipt": receipt,
            "eligible": True,
            "exclusion_reason": "",
            "cluster_id": 0,
            "cluster_label": "",
            "relevance_score": 0,
            "is_duplicate": False,
            "duplicate_of_id": "",
            "selected": False,
            "selection_rank": 0,
            "reason_code": "",
            "rationale": "",
        }

        docket["testimonies"].append(record)
        self._persist_docket(int(docket_id), docket)
        return u256(idx)
