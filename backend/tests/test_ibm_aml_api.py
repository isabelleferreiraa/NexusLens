"""Offline contract tests with a temporary SQLite database (no real CSV/production DB)."""
from __future__ import annotations

import sys
import unittest
from pathlib import Path

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session
from sqlalchemy.pool import StaticPool

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.routers.ibm_aml import get_ibm_db, router


class IbmAmlApiTests(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            'sqlite+pysqlite:///:memory:',
            connect_args={'check_same_thread': False},
            poolclass=StaticPool,
        )
        self.api = FastAPI()
        self.api.include_router(router)

        def get_test_db():
            with Session(self.engine) as session:
                yield session

        self.api.dependency_overrides[get_ibm_db] = get_test_db
        self.client = TestClient(self.api)

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def create_tables(self):
        with self.engine.begin() as conn:
            conn.execute(text('''CREATE TABLE ibm_aml_accounts (
                account_id VARCHAR(200) PRIMARY KEY, dataset_id VARCHAR(50),
                bank_ref VARCHAR(60), account_ref VARCHAR(100))'''))
            conn.execute(text('''CREATE TABLE ibm_aml_transactions (
                transaction_id VARCHAR(80) PRIMARY KEY, dataset_id VARCHAR(50),
                origin_id VARCHAR(200), destination_id VARCHAR(200),
                occurred_at TIMESTAMP, amount_paid NUMERIC(20,2),
                payment_currency VARCHAR(50), amount_received NUMERIC(20,2),
                receiving_currency VARCHAR(50), payment_format VARCHAR(64),
                is_laundering_label BOOLEAN)'''))

    def seed(self):
        self.create_tables()
        with self.engine.begin() as conn:
            conn.execute(text('''INSERT INTO ibm_aml_accounts VALUES
                ('bank:1|account:ABCDE', 'ibm-aml-hi-small','1','ABCDE'),
                ('bank:2|account:FGHIJ', 'ibm-aml-hi-small','2','FGHIJ'),
                ('bank:3|account:KLMNO', 'ibm-aml-hi-small','3','KLMNO')'''))
            conn.execute(text('''INSERT INTO ibm_aml_transactions VALUES
                ('ibm-aml-hi-small:1','ibm-aml-hi-small','bank:1|account:ABCDE','bank:2|account:FGHIJ',
                 '2022-09-01 00:20:00',25.50,'US Dollar',25.50,'US Dollar','Wire',1),
                ('ibm-aml-hi-small:2','ibm-aml-hi-small','bank:2|account:FGHIJ','bank:3|account:KLMNO',
                 '2022-09-02 00:20:00',34.70,'US Dollar',34.70,'US Dollar','ACH',0),
                ('ibm-aml-hi-small:3','ibm-aml-hi-small','bank:3|account:KLMNO','bank:1|account:ABCDE',
                 '2022-09-03 00:20:00',10.00,'US Dollar',10.00,'US Dollar','Cheque',0)'''))

    def test_status_before_import_is_clear_and_does_not_create_tables(self):
        result = self.client.get('/datasets/ibm-aml/status')
        self.assertEqual(result.status_code, 200)
        data = result.json()
        self.assertFalse(data['disponivel'])
        self.assertEqual(data['situacao'], 'nao_importado')
        self.assertEqual(data['total_transacoes'], 0)
        self.assertTrue(data['dados_sinteticos'])

    def test_status_with_empty_tables(self):
        self.create_tables()
        data = self.client.get('/datasets/ibm-aml/status').json()
        self.assertFalse(data['disponivel'])
        self.assertEqual(data['situacao'], 'vazio')

    def test_transactions_are_paginated_and_never_return_ground_truth_labels(self):
        self.seed()
        res = self.client.get('/datasets/ibm-aml/transacoes?limit=2&offset=1')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data['total_transacoes'], 3)
        self.assertEqual(len(data['transacoes']), 2)
        self.assertEqual(data['transacoes'][0]['valor'], 34.7)
        self.assertEqual(data['transacoes'][0]['moeda'], 'USD')
        self.assertNotIn('is_laundering_label', str(data).lower())
        self.assertNotIn('lavagem', str(data).lower())

    def test_graph_has_real_source_edges_with_network_metrics(self):
        self.seed()
        res = self.client.get('/datasets/ibm-aml/grafo')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data['nos']), 3)
        self.assertEqual(len(data['arestas']), 3)
        self.assertEqual(data['transacoes_no_recorte'], 3)
        self.assertEqual(data['metricas']['quantidade_arestas'], 3)
        self.assertIn(data['nos'][0]['risco'], ('Alto', 'Médio', 'Baixo'))
        self.assertTrue(all(e['moeda'] == 'USD' for e in data['arestas']))
        self.assertNotIn('is_laundering_label', str(data).lower())

    def test_graph_respects_limit_and_marks_partial_slice(self):
        self.seed()
        data = self.client.get('/datasets/ibm-aml/grafo?limit=2').json()
        self.assertTrue(data['recorte_parcial'])
        self.assertEqual(len(data['arestas']), 2)
        self.assertEqual(data['transacoes_no_recorte'], 2)

    def test_no_import_returns_empty_lists_without_false_data(self):
        graph = self.client.get('/datasets/ibm-aml/grafo').json()
        rows = self.client.get('/datasets/ibm-aml/transacoes').json()
        self.assertEqual(graph['nos'], [])
        self.assertEqual(graph['arestas'], [])
        self.assertIsNone(graph['score_risco'])
        self.assertEqual(rows['transacoes'], [])
        self.assertFalse(rows['disponivel'])

    def test_ignores_records_in_other_currencies(self):
        self.seed()
        with self.engine.begin() as conn:
            conn.execute(text("""INSERT INTO ibm_aml_transactions VALUES
                ('ibm-aml-hi-small:99','ibm-aml-hi-small','bank:1|account:ABCDE','bank:2|account:FGHIJ',
                '2022-09-04 00:20:00',200.00,'Euro',200.00,'Euro','Wire',0)"""))
        status = self.client.get('/datasets/ibm-aml/status').json()
        self.assertEqual(status['total_transacoes'], 3)
        graph = self.client.get('/datasets/ibm-aml/grafo').json()
        self.assertEqual(len(graph['arestas']), 3)
        self.assertTrue(all(e['moeda'] == 'USD' for e in graph['arestas']))

    def test_repeated_directed_relationships_count_as_two_transfers(self):
        self.seed()
        with self.engine.begin() as conn:
            conn.execute(text("""INSERT INTO ibm_aml_transactions VALUES
                ('ibm-aml-hi-small:4','ibm-aml-hi-small','bank:1|account:ABCDE','bank:2|account:FGHIJ',
                '2022-09-04 00:20:00',25.50,'US Dollar',25.50,'US Dollar','Wire',0)"""))
        graph = self.client.get('/datasets/ibm-aml/grafo').json()
        self.assertEqual(graph['transacoes_no_recorte'], 4)
        self.assertEqual(graph['metricas']['quantidade_arestas'], 3)

    def test_limits_are_validated(self):
        self.assertEqual(self.client.get('/datasets/ibm-aml/grafo?limit=1600').status_code, 422)
        self.assertEqual(self.client.get('/datasets/ibm-aml/transacoes?limit=201').status_code, 422)
        self.assertEqual(self.client.get('/datasets/ibm-aml/transacoes?offset=-1').status_code, 422)


if __name__ == '__main__':
    unittest.main()
