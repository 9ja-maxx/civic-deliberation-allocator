"""Comprehensive Unit Tests for Civic Deliberation Allocator Intelligent Contract."""

from datetime import datetime, timezone
import hashlib
import json
import unittest

import tests.conftest  # Sets up mock genlayer in sys.modules
import genlayer as gl
from contracts.civic_deliberation_allocator import (
    CivicDeliberationAllocator,
    CHALLENGE_DUPLICATE_COLLUSION,
    CHALLENGE_PROVENANCE_MISMATCH,
    MAX_TESTIMONIES,
    REASON_PRIMARY_CLUSTER_DELEGATE,
    REASON_SECONDARY_CLUSTER_DEPTH,
    REASON_UNSELECTED_SEMANTIC_DUPLICATE,
    REASON_UNSELECTED_PROVENANCE_DISQUALIFIED,
    STATUS_ACCEPTED,
    STATUS_PENDING,
    STATUS_REJECTED,
    STATE_ANNULLED_PRELOCK,
    STATE_CONTESTATION_OPEN,
    STATE_ENROLLING,
    STATE_MANIFEST_LOCKED,
    STATE_SOVEREIGN_RATIFIED,
    STATE_THEMATIC_CONSENSUS,
)
from scripts.testimony_manifest import compute_manifest_digest


ORGANIZER = "0x1111111111111111111111111111111111111111"
CITIZEN_A = "0x2222222222222222222222222222222222222222"
CHARTER_URL = "https://civic.org/charter-2026.txt"
CHARTER_TEXT = "Civic Deliberation Assembly on Urban Resilience & Housing Affordability."
CHARTER_DIGEST = hashlib.sha256(CHARTER_TEXT.encode("utf-8")).hexdigest()


class TestCivicDeliberationAllocator(unittest.TestCase):
    def setUp(self):
        self.allocator = CivicDeliberationAllocator()
        gl.message.sender_address = ORGANIZER
        gl.nondet.web.clear()
        gl.nondet.web.set_url_content(CHARTER_URL, CHARTER_TEXT)

    def _get_future_deadlines(self, enroll_offset=1000, contest_offset=2000):
        now = int(datetime.now(timezone.utc).timestamp())
        return now + enroll_offset, now + contest_offset

    def _populate_sample_docket(self, count=4, slots=2):
        enroll_dl, contest_dl = self._get_future_deadlines()
        testimonies = []
        for i in range(count):
            tid = f"testimony-{i + 1}"
            url = f"https://civic.org/testimony-{i + 1}.txt"
            body = f"Citizen viewpoint on housing access and municipal zoning #{i + 1}"
            digest = hashlib.sha256(body.encode("utf-8")).hexdigest()
            testimonies.append({"testimony_id": tid, "url": url, "digest": digest, "body": body})
            gl.nondet.web.set_url_content(url, body)

        manifest_digest = compute_manifest_digest(testimonies)
        docket_id = self.allocator.initialize_docket(
            CHARTER_URL, CHARTER_DIGEST, manifest_digest, slots, enroll_dl, contest_dl
        )

        for t in testimonies:
            self.allocator.enroll_testimony(docket_id, t["testimony_id"], t["url"], t["digest"])

        return docket_id, testimonies, manifest_digest

    # --------------------------------------------------------------------------
    # 1. Docket Initialization
    # --------------------------------------------------------------------------

    def test_initialize_docket_success(self):
        e_dl, c_dl = self._get_future_deadlines()
        d_id = self.allocator.initialize_docket(
            CHARTER_URL, CHARTER_DIGEST, "a" * 64, 3, e_dl, c_dl
        )
        self.assertEqual(d_id, 1)
        self.assertEqual(self.allocator.get_docket_count(), 1)
        self.assertEqual(self.allocator.get_docket_state(d_id), STATE_ENROLLING)

    def test_initialize_docket_invalid_url(self):
        e_dl, c_dl = self._get_future_deadlines()
        with self.assertRaises(gl.vm.UserError):
            self.allocator.initialize_docket("ftp://invalid.org", CHARTER_DIGEST, "a" * 64, 3, e_dl, c_dl)

    def test_initialize_docket_invalid_slots(self):
        e_dl, c_dl = self._get_future_deadlines()
        with self.assertRaises(gl.vm.UserError):
            self.allocator.initialize_docket(CHARTER_URL, CHARTER_DIGEST, "a" * 64, 0, e_dl, c_dl)
        with self.assertRaises(gl.vm.UserError):
            self.allocator.initialize_docket(CHARTER_URL, CHARTER_DIGEST, "a" * 64, 7, e_dl, c_dl)

    def test_initialize_docket_past_deadline(self):
        now = int(datetime.now(timezone.utc).timestamp())
        with self.assertRaises(gl.vm.UserError):
            self.allocator.initialize_docket(CHARTER_URL, CHARTER_DIGEST, "a" * 64, 3, now - 100, now + 100)

    # --------------------------------------------------------------------------
    # 2. Testimony Enrollment
    # --------------------------------------------------------------------------

    def test_enroll_testimony_success(self):
        e_dl, c_dl = self._get_future_deadlines()
        d_id = self.allocator.initialize_docket(CHARTER_URL, CHARTER_DIGEST, "a" * 64, 2, e_dl, c_dl)
        idx = self.allocator.enroll_testimony(d_id, "t-01", "https://civic.org/t1", "b" * 64)
        self.assertEqual(idx, 0)
        self.assertEqual(self.allocator.get_testimony_count(d_id), 1)

    def test_enroll_testimony_unauthorized(self):
        e_dl, c_dl = self._get_future_deadlines()
        d_id = self.allocator.initialize_docket(CHARTER_URL, CHARTER_DIGEST, "a" * 64, 2, e_dl, c_dl)
        gl.message.sender_address = CITIZEN_A
        with self.assertRaises(gl.vm.UserError):
            self.allocator.enroll_testimony(d_id, "t-01", "https://civic.org/t1", "b" * 64)

    def test_enroll_testimony_duplicates(self):
        e_dl, c_dl = self._get_future_deadlines()
        d_id = self.allocator.initialize_docket(CHARTER_URL, CHARTER_DIGEST, "a" * 64, 2, e_dl, c_dl)
        self.allocator.enroll_testimony(d_id, "t-01", "https://civic.org/t1", "b" * 64)

        # Duplicate ID
        with self.assertRaises(gl.vm.UserError):
            self.allocator.enroll_testimony(d_id, "t-01", "https://civic.org/t2", "c" * 64)
        # Duplicate URL
        with self.assertRaises(gl.vm.UserError):
            self.allocator.enroll_testimony(d_id, "t-02", "https://civic.org/t1", "d" * 64)
        # Duplicate digest
        with self.assertRaises(gl.vm.UserError):
            self.allocator.enroll_testimony(d_id, "t-03", "https://civic.org/t3", "b" * 64)

    # --------------------------------------------------------------------------
    # 3. Manifest Lock & Annulment
    # --------------------------------------------------------------------------

    def test_manifest_lock_success(self):
        d_id, testimonies, expected_hash = self._populate_sample_docket(3, 2)
        locked_hash = self.allocator.commit_and_lock_manifest(d_id)
        self.assertEqual(locked_hash, expected_hash)
        self.assertEqual(self.allocator.get_docket_state(d_id), STATE_MANIFEST_LOCKED)

    def test_manifest_lock_mismatch(self):
        e_dl, c_dl = self._get_future_deadlines()
        d_id = self.allocator.initialize_docket(CHARTER_URL, CHARTER_DIGEST, "f" * 64, 1, e_dl, c_dl)
        self.allocator.enroll_testimony(d_id, "t-1", "https://civic.org/1", "1" * 64)
        with self.assertRaises(gl.vm.UserError):
            self.allocator.commit_and_lock_manifest(d_id)

    def test_annul_docket(self):
        e_dl, c_dl = self._get_future_deadlines()
        d_id = self.allocator.initialize_docket(CHARTER_URL, CHARTER_DIGEST, "f" * 64, 1, e_dl, c_dl)
        self.allocator.annul_docket(d_id)
        self.assertEqual(self.allocator.get_docket_state(d_id), STATE_ANNULLED_PRELOCK)

    # --------------------------------------------------------------------------
    # 4. Consensus Clustering & Sortition Allocation
    # --------------------------------------------------------------------------

    def test_clustering_and_sortition_lifecycle(self):
        d_id, testimonies, expected_hash = self._populate_sample_docket(4, 2)
        self.allocator.commit_and_lock_manifest(d_id)

        # Mock LLM clustering response
        mock_llm_output = {
            "clusters": [
                {"cluster_id": 1, "label": "Affordable Density", "summary": "Advocates for multi-family zoning"},
                {"cluster_id": 2, "label": "Environmental Setbacks", "summary": "Focuses on ecological preservation"},
            ],
            "evaluations": [
                {"testimony_id": "testimony-1", "cluster_id": 1, "relevance_score": 90, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
                {"testimony_id": "testimony-2", "cluster_id": 1, "relevance_score": 85, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
                {"testimony_id": "testimony-3", "cluster_id": 2, "relevance_score": 92, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
                {"testimony_id": "testimony-4", "cluster_id": 2, "relevance_score": 80, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
            ],
        }
        gl.nondet.set_llm_handler(lambda prompt: json.dumps(mock_llm_output))

        # Cluster testimonies
        cluster_res = json.loads(self.allocator.cluster_testimonies(d_id))
        self.assertEqual(cluster_res["cluster_count"], 2)
        self.assertEqual(self.allocator.get_docket_state(d_id), STATE_THEMATIC_CONSENSUS)

        # Allocate sortition delegates
        delegates = json.loads(self.allocator.allocate_sortition_delegates(d_id))
        self.assertEqual(len(delegates), 2)
        self.assertEqual(self.allocator.get_docket_state(d_id), STATE_CONTESTATION_OPEN)

        # Confirm coverage-first selection: 1 from Cluster 2, 1 from Cluster 1
        winner_ids = {d["testimony_id"] for d in delegates}
        self.assertIn("testimony-3", winner_ids)  # Highest in Cluster 2
        self.assertIn("testimony-1", winner_ids)  # Highest in Cluster 1

    # --------------------------------------------------------------------------
    # 5. Contestation & Dynamic Re-Sortition
    # --------------------------------------------------------------------------

    def test_contestation_provenance_mismatch(self):
        d_id, testimonies, expected_hash = self._populate_sample_docket(3, 1)
        self.allocator.commit_and_lock_manifest(d_id)

        mock_llm = {
            "clusters": [{"cluster_id": 1, "label": "Theme A", "summary": "Theme summary"}],
            "evaluations": [
                {"testimony_id": "testimony-1", "cluster_id": 1, "relevance_score": 90, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
                {"testimony_id": "testimony-2", "cluster_id": 1, "relevance_score": 80, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
                {"testimony_id": "testimony-3", "cluster_id": 1, "relevance_score": 70, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False},
            ],
        }
        gl.nondet.set_llm_handler(lambda p: json.dumps(mock_llm))
        self.allocator.cluster_testimonies(d_id)
        self.allocator.allocate_sortition_delegates(d_id)

        # Open challenge against testimony-1
        gl.message.sender_address = CITIZEN_A
        ch_id = self.allocator.open_contestation(d_id, CHALLENGE_PROVENANCE_MISMATCH, json.dumps(["testimony-1"]))
        self.assertEqual(ch_id, 1)

        # Modify web content of testimony-1 so digest no longer matches
        gl.nondet.web.set_url_content("https://civic.org/testimony-1.txt", "Tampered content drift")

        # Resolve challenge
        res = json.loads(self.allocator.resolve_contestation(d_id, ch_id))
        self.assertEqual(res["status"], STATUS_ACCEPTED)

        # Check that testimony-1 was disqualified and re-sortition occurred
        t1 = json.loads(self.allocator.get_testimony_by_id(d_id, "testimony-1"))
        self.assertFalse(t1["eligible"])
        self.assertEqual(t1["exclusion_reason"], REASON_UNSELECTED_PROVENANCE_DISQUALIFIED)

        ledger = json.loads(self.allocator.get_sortition_ledger(d_id))
        self.assertEqual(ledger[0]["testimony_id"], "testimony-2")  # Next highest eligible

    # --------------------------------------------------------------------------
    # 6. Ratification & Immutability
    # --------------------------------------------------------------------------

    def test_ratify_docket_lifecycle(self):
        now = int(datetime.now(timezone.utc).timestamp())
        # Docket with deadlines in the past (using mock warp or short offset)
        d_id = self.allocator.initialize_docket(CHARTER_URL, CHARTER_DIGEST, "a" * 64, 1, now + 1, now + 2)
        self.allocator.enroll_testimony(d_id, "t-1", "https://civic.org/t1", "1" * 64)
        expected = compute_manifest_digest([{"testimony_id": "t-1", "url": "https://civic.org/t1", "digest": "1" * 64}])

        # Re-initialize with matching digest
        d_id = self.allocator.initialize_docket(CHARTER_URL, CHARTER_DIGEST, expected, 1, now + 1, now + 2)
        self.allocator.enroll_testimony(d_id, "t-1", "https://civic.org/t1", "1" * 64)
        self.allocator.commit_and_lock_manifest(d_id)

        mock_llm = {
            "clusters": [{"cluster_id": 1, "label": "T", "summary": "S"}],
            "evaluations": [{"testimony_id": "t-1", "cluster_id": 1, "relevance_score": 90, "is_duplicate": False, "duplicate_of_id": "", "is_irrelevant": False}],
        }
        gl.nondet.set_llm_handler(lambda p: json.dumps(mock_llm))
        gl.nondet.web.set_url_content("https://civic.org/t1", "testimony text")

        self.allocator.cluster_testimonies(d_id)
        self.allocator.allocate_sortition_delegates(d_id)

        # Cannot ratify while contestation window is active
        with self.assertRaises(gl.vm.UserError):
            self.allocator.ratify_docket(d_id)


if __name__ == "__main__":
    unittest.main()
