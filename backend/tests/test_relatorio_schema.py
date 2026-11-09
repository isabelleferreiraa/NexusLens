import sys
import unittest
from pathlib import Path
from pydantic import ValidationError

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.schemas.relatorio import RelatorioRequest


VALID = dict(score_risco=42, classificacao='Moderada', metricas={
    'quantidade_nos': 23,
    'quantidade_arestas': 35,
    'nivel_influencia': 'Média',
    'quantidade_conexoes': 'Conectada',
    'papel_na_rede': 'Conta participante',
})

class SchemaTests(unittest.TestCase):
    def test_valid_payload(self):
        req = RelatorioRequest.model_validate(VALID)
        self.assertEqual(req.metricas.quantidade_nos, 23)

    def test_missing_metrics_is_validation_error_not_key_error(self):
        with self.assertRaises(ValidationError):
            RelatorioRequest.model_validate({'score_risco': 45, 'classificacao': 'Alto'})

    def test_rejects_raw_transactions_and_laundering_labels(self):
        with self.assertRaises(ValidationError):
            RelatorioRequest.model_validate({**VALID, 'transacoes': [{'valor': 100}]})
        with self.assertRaises(ValidationError):
            RelatorioRequest.model_validate({**VALID, 'metricas': {**VALID['metricas'], 'is_laundering_label': True}})

    def test_rejects_invalid_scores(self):
        for score in [-1, float('inf'), float('nan'), 101]:
            with self.assertRaises(ValidationError):
                RelatorioRequest.model_validate({**VALID, 'score_risco': score})

if __name__ == '__main__':
    unittest.main()
