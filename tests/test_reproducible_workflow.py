"""
Regression Test Suite: Verified Reproducible Sample & End-to-End Workflow.
Author: 9ja_maxx (9ja-maxx)
"""

from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import sys
import unittest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import tests.conftest
import genlayer as gl
from contracts.civic_deliberation_allocator import (
    CivicDeliberationAllocator,
    STATE_ENROLLING,
    STATE_MANIFEST_LOCKED,
    STATE_THEMATIC_CONSENSUS,
    STATE_CONTESTATION_OPEN,
    CHALLENGE_PROVENANCE_MISMATCH,
)
from scripts.testimony_manifest import compute_manifest_digest, build_canonical_manifest

ORGANIZER: str = "0x1111111111111111111111111111111111111111"
CITIZEN: str = "0x2222222222222222222222222222222222222222"

CHARTER_URL = (
    "https://raw.githubusercontent.com/9ja-maxx/civic-deliberation-allocator/main/frontend/public/fixtures/transit-charter-2026.txt"
)
CHARTER_DIGEST = "25e937cb2139d5f128cd7a323948a0b5c93054ea9c01f23eb43c70ee9e6dd7dc"
EXPECTED_MANIFEST_DIGEST = "b7d648bdd4e686363e672b05764b8ec5008d66e92515b266f6f53e417cc2791f"

SAMPLE_TESTIMONIES = [
    {
        "testimony_id": "t-commuter-union",
        "url": "https://raw.githubusercontent.com/9ja-maxx/civic-deliberation-allocator/main/frontend/public/fixtures/t1-commuter-union.txt",
        "digest": "b5485afe74ffcb941b79ea1a4a3b59a6e24ba1274957ec83ce6b21c9864b5ffe",
        "fixture_file": "t1-commuter-union.txt",
    },
    {
        "testimony_id": "t-active-mobility",
        "url": "https://raw.githubusercontent.com/9ja-maxx/civic-deliberation-allocator/main/frontend/public/fixtures/t2-active-mobility.txt",
        "digest": "186e0cd86faf4224f81ac771bacb08dec5197378a28b58edb82a1006da296a75",
        "fixture_file": "t2-active-mobility.txt",
    },
    {
        "testimony_id": "t-suburban-transit",
        "url": "https://raw.githubusercontent.com/9ja-maxx/civic-deliberation-allocator/main/frontend/public/fixtures/t3-suburban-transit.txt",
        "digest": "89581e1abc9bd02fa477aca4f221ffdf6bec6e773d2c2414d0002229651957fa",
        "fixture_file": "t3-suburban-transit.txt",
    },
    {
        "testimony_id": "t-green-corridor",
        "url": "https://raw.githubusercontent.com/9ja-maxx/civic-deliberation-allocator/main/frontend/public/fixtures/t4-green-corridor.txt",
        "digest": "a2a66059e12b52c8160e43585e160324d0d307d73c6c84979120a2238eb0a2e6",
        "fixture_file": "t4-green-corridor.txt",
    },
]


class TestCivicReproducibleWorkflow(unittest.TestCase):
    def setUp(self):
        gl.message.sender_address = ORGANIZER
        gl.nondet.web.clear()
        gl.nondet.set_llm_handler(None)
        self.allocator = CivicDeliberationAllocator()

    def test_fixture_files_integrity(self):
        """Assert that local checked-in fixture files match their advertised cryptographic SHA-256 digests."""
        fixtures_dir = Path(__file__).resolve().parent.parent / "frontend" / "public" / "fixtures"

        # Verify charter
        charter_path = fixtures_dir / "transit-charter-2026.txt"
        self.assertTrue(charter_path.exists(), f"Missing charter fixture: {charter_path}")
        charter_bytes = charter_path.read_bytes()
        actual_charter_hash = hashlib.sha256(charter_bytes).hexdigest()
        self.assertEqual(actual_charter_hash, CHARTER_DIGEST)

        # Verify 4 testimonies
        for item in SAMPLE_TESTIMONIES:
            p = fixtures_dir / item["fixture_file"]
            self.assertTrue(p.exists(), f"Missing fixture file: {p}")
            content = p.read_bytes()
            actual_hash = hashlib.sha256(content).hexdigest()
            self.assertEqual(actual_hash, item["digest"], f"Digest mismatch for {item['fixture_file']}")

    def test_sample_canonical_manifest_digest(self):
        """Assert that canonical manifest generation for the 4 sample testimonies produces the expected digest."""
        calc_digest = compute_manifest_digest(SAMPLE_TESTIMONIES)
        self.assertEqual(calc_digest, EXPECTED_MANIFEST_DIGEST)

    def test_reproducible_workflow_initialize_enroll_lock_cluster(self):
        """Assert that the reproducible sample can initialize, enroll, lock, and reach clustering."""
        now = int(datetime.now(timezone.utc).timestamp())
        enroll_dl = now + 86400
        contest_dl = now + 172800

        # 1. Initialize
        docket_id = self.allocator.initialize_docket(
            CHARTER_URL,
            CHARTER_DIGEST,
            EXPECTED_MANIFEST_DIGEST,
            2,
            enroll_dl,
            contest_dl,
        )
        self.assertEqual(docket_id, 1)
        self.assertEqual(self.allocator.get_docket_state(docket_id), STATE_ENROLLING)

        # 2. Enroll 4 testimonies
        for t in SAMPLE_TESTIMONIES:
            self.allocator.enroll_testimony(docket_id, t["testimony_id"], t["url"], t["digest"])

        # 3. Commit & Lock Manifest
        locked_hash = self.allocator.commit_and_lock_manifest(docket_id)
        self.assertEqual(locked_hash, EXPECTED_MANIFEST_DIGEST)
        self.assertEqual(self.allocator.get_docket_state(docket_id), STATE_MANIFEST_LOCKED)

        # 4. Prepare Web and LLM doubles for clustering
        fixtures_dir = Path(__file__).resolve().parent.parent / "frontend" / "public" / "fixtures"
        charter_text = (fixtures_dir / "transit-charter-2026.txt").read_text(encoding="utf-8")
        gl.nondet.web.set_url_content(CHARTER_URL, charter_text)

        for t in SAMPLE_TESTIMONIES:
            t_text = (fixtures_dir / t["fixture_file"]).read_text(encoding="utf-8")
            gl.nondet.web.set_url_content(t["url"], t_text)

        mock_llm = {
            "clusters": [
                {"cluster_id": 1, "label": "Transit Corridor Expansion", "summary": "Heavy transit, bus rapid corridors, and rail"},
                {"cluster_id": 2, "label": "Active Mobility & Safety", "summary": "Pedestrian safety, bike lanes, micro-mobility"},
            ],
            "evaluations": [
                {"testimony_id": "t-commuter-union", "cluster_id": 1, "relevance_score": 92, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
                {"testimony_id": "t-suburban-transit", "cluster_id": 1, "relevance_score": 85, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
                {"testimony_id": "t-active-mobility", "cluster_id": 2, "relevance_score": 89, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
                {"testimony_id": "t-green-corridor", "cluster_id": 2, "relevance_score": 84, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
            ],
        }
        gl.nondet.set_llm_handler(lambda prompt: json.dumps(mock_llm))

        # 5. Execute Clustering
        cluster_summary = json.loads(self.allocator.cluster_testimonies(docket_id))
        self.assertEqual(cluster_summary["cluster_count"], 2)
        self.assertEqual(self.allocator.get_docket_state(docket_id), STATE_THEMATIC_CONSENSUS)

        # 6. Allocate Sortition Delegates
        delegates = json.loads(self.allocator.allocate_sortition_delegates(docket_id))
        self.assertEqual(len(delegates), 2)
        self.assertEqual(self.allocator.get_docket_state(docket_id), STATE_CONTESTATION_OPEN)

        # 7. File Evidence Contestation (Unbonded)
        gl.message.sender_address = CITIZEN
        ch_id = self.allocator.open_contestation(
            docket_id,
            CHALLENGE_PROVENANCE_MISMATCH,
            json.dumps(["t-commuter-union"]),
        )
        self.assertEqual(ch_id, 1)

        contestations = json.loads(self.allocator.get_all_contestations(docket_id))
        self.assertEqual(len(contestations), 1)
        self.assertEqual(contestations[0]["target_ids"], ["t-commuter-union"])
        self.assertEqual(contestations[0]["challenger"], CITIZEN)


if __name__ == "__main__":
    unittest.main()
