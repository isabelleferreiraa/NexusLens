"""Offline tests; use synthetic, locally constructed CSV fixtures only."""
import csv
import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'import_ibm_aml.py'
spec = importlib.util.spec_from_file_location('ibm_import', SCRIPT)
module = importlib.util.module_from_spec(spec)
import sys
sys.modules[spec.name] = module
spec.loader.exec_module(module)


def row(bank1, acct1, bank2, acct2, amount, label, currency='US Dollar'):
    return ['2022/09/01 00:20', bank1, acct1, bank2, acct2, amount, currency,
            amount, currency, 'Wire', str(label)]


class ImportTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / 'HI-Small_Trans.csv'
        self.rows = [
            row('10', 'XYZ', '20', 'XYZ', '12.50', 1),
            row('20', 'XYZ', '30', 'A', '50', 0),
            row('10', 'XYZ', '40', 'B', '75', 0),
            row('80', 'Q', '90', 'R', '999', 0),
            row('10', 'XYZ', '50', 'C', '100', 0, 'Euro'),
        ]
        with self.path.open('w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(module.HEADER)
            writer.writerows(self.rows)

    def tearDown(self):
        self.tmp.cleanup()

    def test_preserves_bank_account_composite_identity(self):
        r = module.parse_record(1, self.rows[0], 'US Dollar')
        self.assertNotEqual(r.origin, r.destination)
        self.assertIn('bank:10', r.origin)
        self.assertIn('bank:20', r.destination)

    def test_uses_paid_and_received_amount_without_exchange(self):
        r = module.parse_record(1, self.rows[0], 'US Dollar')
        self.assertEqual(str(r.amount_paid), '12.50')
        self.assertTrue(r.labeled_laundering)
        self.assertIsNone(module.parse_record(5, self.rows[4], 'US Dollar'))

    def test_selects_neighboring_rows_not_unrelated_rows(self):
        result, info = module.choose_sample(self.path, max_transactions=3, max_accounts=6,
                                             labeled_seeds=1, random_seed=42)
        self.assertEqual([r.line for r in result], [1, 2, 3])
        self.assertEqual(info['selected_labeled_rows'], 1)
        self.assertEqual(info['selected_accounts'], 4)

    def test_reproducible(self):
        a, _ = module.choose_sample(self.path, max_transactions=3, max_accounts=6,
                                     labeled_seeds=1)
        b, _ = module.choose_sample(self.path, max_transactions=3, max_accounts=6,
                                     labeled_seeds=1)
        self.assertEqual(a, b)

    def test_rejects_wrong_header_instead_of_swapping_accounts(self):
        with self.path.open('w', newline='', encoding='utf-8') as f:
            w = csv.writer(f)
            w.writerow(['Timestamp', 'Account', 'Account'])
        with self.assertRaisesRegex(ValueError, 'Cabeçalho inesperado'):
            module.choose_sample(self.path, max_transactions=3, max_accounts=6,
                                  labeled_seeds=1)

    def test_default_dry_run_does_not_connect_to_db(self):
        import contextlib
        import io
        output = io.StringIO()
        old_connect = module.connect_postgres
        try:
            module.connect_postgres = lambda: self.fail('Dry run must not connect')
            with contextlib.redirect_stdout(output):
                module.main(['--csv', str(self.path), '--labeled-seeds', '1'])
        finally:
            module.connect_postgres = old_connect
        self.assertIn('DRY RUN', output.getvalue())


if __name__ == '__main__':
    unittest.main()
