"""Offline tests for the optional CSV downloader, without network access."""
import hashlib
import importlib.util
import io
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/download_ibm_aml.py'
spec = importlib.util.spec_from_file_location('aml_csv_download', SCRIPT)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class MockResponse(io.BytesIO):
    def geturl(self):
        return "https://cdn.example.org/test.csv"


class DownloadTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / 'raw/HI-Small_Trans.csv'
        self.fixture = b"original IBM CSV fixture for local testing only\n"
        self.sha = hashlib.sha256(self.fixture).hexdigest()

    def tearDown(self):
        self.tmp.cleanup()

    def test_download_streams_and_checks_hash_without_network(self):
        result = mod.download_csv(self.path, expected_size=len(self.fixture),
                                  expected_sha256=self.sha,
                                  opener=lambda request, timeout: MockResponse(self.fixture))
        self.assertEqual(result, 'downloaded_and_verified')
        self.assertEqual(self.path.read_bytes(), self.fixture)
        self.assertEqual(mod.download_csv(self.path, expected_size=len(self.fixture),
                         expected_sha256=self.sha), 'already_verified')

    def test_mismatched_file_is_never_published(self):
        with self.assertRaisesRegex(ValueError, 'SHA-256'):
            mod.download_csv(self.path, expected_size=len(self.fixture),
                             expected_sha256='0' * 64,
                             opener=lambda request, timeout: MockResponse(self.fixture))
        self.assertFalse(self.path.exists())
        self.assertFalse(self.path.with_name(self.path.name + '.partial').exists())

    def test_never_overwrites_existing_file(self):
        self.path.parent.mkdir(parents=True)
        self.path.write_bytes(b'original')
        with self.assertRaises(FileExistsError):
            mod.download_csv(self.path, expected_size=len(self.fixture),
                             expected_sha256=self.sha)
        self.assertEqual(self.path.read_bytes(), b'original')

    def test_requires_https(self):
        with self.assertRaisesRegex(ValueError, 'HTTPS'):
            mod.download_csv(self.path, url='http://example.org/dataset.csv',
                             expected_size=len(self.fixture), expected_sha256=self.sha)


if __name__ == '__main__':
    unittest.main()
