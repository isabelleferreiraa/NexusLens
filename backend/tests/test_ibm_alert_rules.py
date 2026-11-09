import importlib.util
from pathlib import Path
import unittest
import sys

FILE = Path(__file__).resolve().parents[1] / "app" / "services" / "ibm_alert_rules.py"
spec = importlib.util.spec_from_file_location("ibm_alert_rules", FILE)
rules = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = rules
spec.loader.exec_module(rules)


def tx(id, src, dst, value, timestamp="2022-09-01T10:00:00", currency="USD", **extra):
    return {"id_transacao": id, "origem": src, "destino": dst, "valor": value,
            "data_transacao": timestamp, "moeda": currency, **extra}


class TestIBMRiskPatterns(unittest.TestCase):
    def test_reciprocal_pair(self):
        events = rules.detectar_sinais([
            tx("1", "A", "B", 150), tx("2", "B", "A", 100, "2022-09-02T09:00:00")])
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["regra"], "ida_volta_24h")
        self.assertEqual(events[0]["contas"], ["A", "B"])

    def test_reciprocal_window_expired(self):
        self.assertEqual(rules.detectar_sinais([
            tx("1", "A", "B", 150), tx("2", "B", "A", 100, "2022-09-04T10:01:00")]), [])

    def test_fanout_four_destinations_in_day(self):
        rows = [tx(str(i), "A", f"D{i}", (i + 1) * 10, f"2022-09-01T{10 + i}:00:00") for i in range(4)]
        events = rules.detectar_sinais(rows)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["regra"], "dispersao_24h")
        self.assertEqual(events[0]["quantidade_evidencias"], 4)

    def test_repeated_same_destination_is_not_fanout(self):
        rows = [tx(str(i), "A", "B", 20, f"2022-09-01T{10 + i}:00:00") for i in range(5)]
        self.assertEqual(rules.detectar_sinais(rows), [])

    def test_three_account_cycle(self):
        records = [tx("1", "A", "B", 100), tx("2", "B", "C", 92, "2022-09-02T09:00:00"),
                   tx("3", "C", "A", 85, "2022-09-02T10:00:00")]
        events = rules.detectar_sinais(records)
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["regra"], "ciclo_72h")
        self.assertEqual(events[0]["nivel"], "alto")

    def test_cycle_requires_chronology(self):
        records = [tx("1", "A", "B", 100), tx("2", "B", "C", 92, "2022-08-31T09:00:00"),
                   tx("3", "C", "A", 85, "2022-09-02T10:00:00")]
        self.assertEqual(rules.detectar_sinais(records), [])

    def test_cycle_amount_ratio(self):
        records = [tx("1", "A", "B", 100), tx("2", "B", "C", 92, "2022-09-02T09:00:00"),
                   tx("3", "C", "A", 10, "2022-09-02T10:00:00")]
        self.assertEqual(rules.detectar_sinais(records), [])

    def test_ignores_other_currency_and_invalid_records(self):
        records = [tx("1", "A", "B", 100, currency="EUR"),
                   tx("2", "B", "A", 100), tx("3", "A", "B", float("nan")),
                   tx("4", "A", "B", -10)]
        self.assertEqual(rules.detectar_sinais(records), [])

    def test_never_exposes_ground_truth(self):
        events = rules.detectar_sinais([
            tx("1", "A", "B", 100, is_laundering_label=True),
            tx("2", "B", "A", 50, is_laundering_label=True)])
        self.assertEqual(len(events), 1)
        self.assertNotIn("is_laundering_label", str(events))
        self.assertNotIn("laundering", str(events))

    def test_duplicates_and_stable_ids(self):
        data = [tx("1", "A", "B", 100), tx("1", "A", "B", 100), tx("2", "B", "A", 50)]
        a = rules.detectar_sinais(data)
        b = rules.detectar_sinais(data)
        self.assertEqual(a, b)
        self.assertEqual(a[0]["quantidade_evidencias"], 2)

    def test_limit_validation(self):
        with self.assertRaises(ValueError):
            rules.detectar_sinais([], max_eventos=101)
        with self.assertRaises(ValueError):
            rules.detectar_sinais([], max_eventos=0)

if __name__ == "__main__":
    unittest.main()
