"""Opt-in end-to-end test of the IBM import and API against a LOCAL test PostgreSQL.

It creates/drops a unique schema; will NEVER run against a remote database.
Set NEXUSLENS_TEST_DATABASE_URL to an explicitly local *_test database to run.
"""

import csv
import importlib.util
import os
import sys
import tempfile
import unittest
import uuid
from pathlib import Path
from unittest.mock import patch
from urllib.parse import unquote, urlsplit

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.routers.ibm_aml import router, get_ibm_db

IMPORT_SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'import_ibm_aml.py'
SCHEMA = Path(__file__).resolve().parents[2] / 'database' / 'ibm_aml_schema.sql'
spec = importlib.util.spec_from_file_location('test_ibm_aml_import_script', IMPORT_SCRIPT)
import_script = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = import_script
spec.loader.exec_module(import_script)


def authorized_test_url():
    url = os.getenv('NEXUSLENS_TEST_DATABASE_URL', '').strip()
    if not url:
        return None
    parsed = urlsplit(url)
    # Only a developer-controlled local database with an explicit test DB name.
    if parsed.scheme not in ('postgresql', 'postgresql+psycopg2') or parsed.hostname not in ('localhost', '127.0.0.1', '::1'):
        raise ValueError('Recusado: integração PostgreSQL exige host LOCAL (localhost/127.0.0.1).')
    database = unquote(parsed.path.lstrip('/'))
    if not database.lower().endswith('_test'):
        raise ValueError('Recusado: o banco PostgreSQL precisa terminar com _test.')
    return url


class PostgresImportE2E(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.url = authorized_test_url()
        if not cls.url:
            raise unittest.SkipTest('Sem NEXUSLENS_TEST_DATABASE_URL: teste PostgreSQL não executado.')
        try:
            import psycopg2
        except ImportError as exc:
            raise unittest.SkipTest('Instale psycopg2-binary para o teste PostgreSQL.') from exc
        cls.pg = psycopg2
        cls.schema = 'nl_ibm_test_' + uuid.uuid4().hex[:16]
        with psycopg2.connect(cls.url) as conn:
            with conn.cursor() as cur:
                cur.execute(f'CREATE SCHEMA "{cls.schema}"')

    @classmethod
    def tearDownClass(cls):
        if not hasattr(cls, 'schema'):
            return
        with cls.pg.connect(cls.url) as conn:
            with conn.cursor() as cur:
                cur.execute(f'DROP SCHEMA IF EXISTS "{cls.schema}" CASCADE')

    def test_fixture_csv_imports_idempotently_and_endpoints_match_postgres(self):
        with tempfile.TemporaryDirectory() as directory:
            csv_path = Path(directory) / 'HI-Small_Trans.csv'
            fixture = [
                ['2022/09/01 00:20', '1', 'AAA', '2', 'BBB', '10.00', 'US Dollar', '10.00', 'US Dollar', 'Wire', '1'],
                ['2022/09/01 01:20', '2', 'BBB', '3', 'CCC', '20.00', 'US Dollar', '20.00', 'US Dollar', 'ACH', '0'],
                ['2022/09/01 02:20', '8', 'ZZZ', '9', 'QQQ', '99.00', 'US Dollar', '99.00', 'US Dollar', 'Wire', '0'],
                ['2022/09/01 03:20', '1', 'AAA', '3', 'CCC', '15.00', 'US Dollar', '15.00', 'US Dollar', 'Cheque', '0'],
                ['2022/09/01 04:20', '1', 'AAA', '3', 'CCC', '800.00', 'Euro', '800.00', 'Euro', 'Wire', '0'],
            ]
            with csv_path.open('w', newline='', encoding='utf-8') as out:
                writer = csv.writer(out)
                writer.writerow(import_script.HEADER)
                writer.writerows(fixture)
            records, preview = import_script.choose_sample(csv_path, max_transactions=8,
                        max_accounts=8, labeled_seeds=1)
            self.assertEqual(len(records), 3)
            self.assertEqual(preview['selected_accounts'], 3)

            def test_connection():
                return self.pg.connect(self.url, options=f'-c search_path={self.schema}')

            with patch.object(import_script, 'connect_postgres', side_effect=test_connection):
                import_script.import_to_database(records, SCHEMA)
                import_script.import_to_database(records, SCHEMA)

            engine = create_engine(self.url, connect_args={'options': f'-c search_path={self.schema}'})
            try:
                with engine.connect() as con:
                    self.assertEqual(con.execute(text('SELECT COUNT(*) FROM ibm_aml_transactions')).scalar_one(), 3)
                    self.assertEqual(con.execute(text('SELECT COUNT(*) FROM ibm_aml_accounts')).scalar_one(), 3)
                app = FastAPI()
                app.include_router(router)

                def db():
                    with Session(engine) as session:
                        yield session

                app.dependency_overrides[get_ibm_db] = db
                with TestClient(app) as client:
                    status = client.get('/datasets/ibm-aml/status')
                    self.assertEqual(status.status_code, 200)
                    self.assertEqual(status.json()['total_transacoes'], 3)
                    rows = client.get('/datasets/ibm-aml/transacoes?limit=2&offset=1').json()
                    self.assertEqual(len(rows['transacoes']), 2)
                    self.assertTrue(all(r['moeda'] == 'USD' for r in rows['transacoes']))
                    graph = client.get('/datasets/ibm-aml/grafo').json()
                    self.assertEqual(len(graph['nos']), 3)
                    self.assertEqual(len(graph['arestas']), 3)
                    self.assertEqual(graph['transacoes_no_recorte'], 3)
                    self.assertNotIn('is_laundering_label', str(graph))
            finally:
                engine.dispose()


if __name__ == '__main__':
    unittest.main()
