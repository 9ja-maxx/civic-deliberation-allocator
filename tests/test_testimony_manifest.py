import hashlib
import unittest

from scripts.testimony_manifest import (
    build_canonical_manifest,
    compute_manifest_digest,
    compute_text_sha256,
    format_manifest_entry,
    has_forbidden_control_characters,
)


class TestTestimonyManifest(unittest.TestCase):
    def test_control_character_detection(self):
        self.assertTrue(has_forbidden_control_characters("test|data"))
        self.assertTrue(has_forbidden_control_characters("test\ndata"))
        self.assertTrue(has_forbidden_control_characters("test\rdata"))
        self.assertTrue(has_forbidden_control_characters("test\tdata"))
        self.assertFalse(has_forbidden_control_characters("clean-testimony-id_123"))

    def test_format_manifest_entry_valid(self):
        digest = "a" * 64
        entry = format_manifest_entry(0, "cit-01", "https://civic.org/t1", digest)
        self.assertEqual(entry, f"0|cit-01|https://civic.org/t1|{digest}\n")

    def test_format_manifest_entry_invalid_digest(self):
        with self.assertRaises(ValueError):
            format_manifest_entry(0, "cit-01", "https://civic.org/t1", "short_hash")

    def test_format_manifest_entry_invalid_url(self):
        digest = "b" * 64
        with self.assertRaises(ValueError):
            format_manifest_entry(0, "cit-01", "ftp://civic.org/t1", digest)
        with self.assertRaises(ValueError):
            format_manifest_entry(0, "cit-01", "https://civic.org/t1 with spaces", digest)

    def test_build_manifest_and_digest(self):
        testimonies = [
            {"testimony_id": "t-1", "url": "https://civic.gov/1", "digest": "1" * 64},
            {"testimony_id": "t-2", "url": "https://civic.gov/2", "digest": "2" * 64},
        ]
        manifest = build_canonical_manifest(testimonies)
        expected = f"0|t-1|https://civic.gov/1|{'1'*64}\n1|t-2|https://civic.gov/2|{'2'*64}\n"
        self.assertEqual(manifest, expected)

        digest = compute_manifest_digest(testimonies)
        expected_digest = hashlib.sha256(expected.encode("utf-8")).hexdigest().lower()
        self.assertEqual(digest, expected_digest)


if __name__ == "__main__":
    unittest.main()
