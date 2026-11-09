"""Fast, offline contract checks for the read-only IBM API smoke command."""
import importlib.util
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'check_ibm_aml_api.py'
spec = importlib.util.spec_from_file_location('check_ibm_aml_api', SCRIPT)
checker = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = checker
spec.loader.exec_module(checker)


def sample_responses():
    prefix = 'http://localhost:8000/datasets/ibm-aml/'
    nodes = [{'id': 'a', 'nome': 'Conta A', 'risco': 'Baixo'},
             {'id': 'b', 'nome': 'Conta B', 'risco': 'Médio'}]
    row = {'origem': 'a', 'destino': 'b', 'id_transacao': 'T-1', 'valor': 23.75,
           'moeda': 'USD', 'data_transacao': '2023-01-01T00:00:00'}
    return {
        prefix + 'status': {'dataset': 'ibm-aml-hi-small', 'disponivel': True,
                            'situacao': 'pronto', 'moeda': 'USD', 'total_transacoes': 1},
        prefix + 'transacoes?limit=20&offset=0': {'disponivel': True, 'moeda': 'USD',
                                                 'transacoes': [row]},
        prefix + 'grafo?limit=1500': {'disponivel': True, 'moeda': 'USD', 'nos': nodes,
                                      'arestas': [row], 'score_risco': 34,
                                      'metricas': {'quantidade_nos': 2, 'quantidade_arestas': 1},
                                      'transacoes_no_recorte': 1},
    }


class SmokeTests(unittest.TestCase):
    def test_accepts_consistent_ibm_response(self):
        payload = sample_responses()
        code, message = checker.check('http://localhost:8000', fetch=payload.__getitem__)
        self.assertEqual(code, 0, message)

    def test_empty_database_is_not_a_pass(self):
        payload = sample_responses()
        payload['http://localhost:8000/datasets/ibm-aml/status'] = {
            'dataset': 'ibm-aml-hi-small', 'disponivel': False, 'situacao': 'nao_importado'}
        code, message = checker.check('http://localhost:8000', fetch=payload.__getitem__)
        self.assertEqual(code, 2)
        self.assertIn('não disponível', message)

    def test_rejects_mixed_currencies(self):
        payload = sample_responses()
        payload['http://localhost:8000/datasets/ibm-aml/transacoes?limit=20&offset=0']['transacoes'][0]['moeda'] = 'BRL'
        self.assertEqual(checker.check('http://localhost:8000', fetch=payload.__getitem__)[0], 1)

    def test_rejects_missing_graph_nodes(self):
        payload = sample_responses()
        payload['http://localhost:8000/datasets/ibm-aml/grafo?limit=1500']['nos'] = []
        self.assertEqual(checker.check('http://localhost:8000', fetch=payload.__getitem__)[0], 1)

    def test_rejects_ground_truth_labels(self):
        payload = sample_responses()
        payload['http://localhost:8000/datasets/ibm-aml/grafo?limit=1500']['is_laundering_label'] = True
        self.assertEqual(checker.check('http://localhost:8000', fetch=payload.__getitem__)[0], 1)

    def test_rejects_non_https_remote_urls(self):
        self.assertEqual(checker.check('http://some-remote-server.invalid:8000')[0], 1)


if __name__ == '__main__':
    unittest.main()
