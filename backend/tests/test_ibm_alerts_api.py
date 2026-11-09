"""API de padrões IBM: testes locais com SQLite, sem tocar no PostgreSQL."""
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


class TestIBMAlertsAPI(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine('sqlite+pysqlite:///:memory:', connect_args={'check_same_thread':False}, poolclass=StaticPool)
        self.app = FastAPI()
        self.app.include_router(router)
        def db():
            with Session(self.engine) as sess:
                yield sess
        self.app.dependency_overrides[get_ibm_db] = db
        self.client = TestClient(self.app)

    def tearDown(self):
        self.client.close()
        self.engine.dispose()

    def seed(self):
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
            for name in ['A','B','C']:
                conn.execute(text('INSERT INTO ibm_aml_accounts VALUES (:id, :dataset, :bank, :ref)'),
                             {'id':name,'dataset':'ibm-aml-hi-small','bank':'1','ref':name})
            rows = [('1','A','B','2022-09-01 10:00:00',100,1),
                    ('2','B','C','2022-09-01 11:00:00',90,0),
                    ('3','C','A','2022-09-01 12:00:00',85,0),
                    ('4','B','A','2022-09-01 13:00:00',80,0)]
            for tid, src, dest, when, value, label in rows:
                conn.execute(text('''INSERT INTO ibm_aml_transactions VALUES
                    (:id,'ibm-aml-hi-small',:src,:dst,:t,:value,'US Dollar',:value,'US Dollar','Wire',:label)'''),
                    {'id':tid,'src':src,'dst':dest,'t':when,'value':value,'label':label})

    def test_no_import_returns_empty_without_writing(self):
        response = self.client.get('/datasets/ibm-aml/alertas')
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.json()['disponivel'])
        self.assertEqual(response.json()['alertas'], [])

    def test_detects_cycle_and_reciprocal_from_sqlite_data(self):
        self.seed()
        response = self.client.get('/datasets/ibm-aml/alertas')
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body['dataset'],'ibm-aml-hi-small')
        self.assertEqual(body['moeda'],'USD')
        self.assertEqual(body['transacoes_analisadas'],4)
        rules = {alert['regra'] for alert in body['alertas']}
        self.assertIn('ciclo_72h',rules)
        self.assertIn('ida_volta_24h',rules)
        self.assertEqual(body['total_alertas'],len(body['alertas']))
        self.assertNotIn('is_laundering_label',str(body).lower())
        self.assertNotIn('is_laundering_label', str(body).lower())
        with self.engine.connect() as conn:
            self.assertEqual(conn.execute(text('SELECT COUNT(*) FROM ibm_aml_transactions')).scalar(),4)

    def test_limit_marks_partial_analysis(self):
        self.seed()
        data = self.client.get('/datasets/ibm-aml/alertas?limit=2').json()
        self.assertEqual(data['transacoes_analisadas'],2)
        self.assertTrue(data['recorte_parcial'])
        self.assertEqual(data['alertas'],[])

    def test_rejects_above_limits(self):
        self.assertEqual(self.client.get('/datasets/ibm-aml/alertas?limit=1501').status_code,422)
        self.assertEqual(self.client.get('/datasets/ibm-aml/alertas?max_eventos=101').status_code,422)

if __name__ == '__main__': unittest.main()
