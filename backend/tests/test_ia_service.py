import sys
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.ai.ia_service import IAService, RelatorioIndisponivel


class FakeModels:
    def __init__(self, replies):
        self.replies = iter(replies)
        self.calls = []

    def generate_content(self, **kwargs):
        self.calls.append(kwargs)
        item = next(self.replies)
        if isinstance(item, Exception):
            raise item
        return SimpleNamespace(text=item)


class IaServiceTests(unittest.TestCase):
    def test_valid_text_is_returned_without_any_source_rows(self):
        models = FakeModels(['  Parecer baseado em métricas agregadas. '])
        service = IAService(client=SimpleNamespace(models=models), sleep=lambda _: None)
        self.assertEqual(service.gerar_relatorio('Resumo de rede'), 'Parecer baseado em métricas agregadas.')
        self.assertIn('Resumo de rede', models.calls[0]['contents'])
        self.assertNotIn('Is Laundering', models.calls[0]['contents'])

    def test_error_is_not_transformed_into_a_successful_report(self):
        models = FakeModels([RuntimeError('403 PERMISSION_DENIED')])
        service = IAService(client=SimpleNamespace(models=models), sleep=lambda _: None)
        with self.assertRaises(RelatorioIndisponivel):
            service.gerar_relatorio('Métricas')
        self.assertEqual(len(models.calls), 1)

    def test_transient_failures_are_retried_with_limit(self):
        models = FakeModels([RuntimeError('503 UNAVAILABLE'), 'Parecer final'])
        sleeps = []
        service = IAService(client=SimpleNamespace(models=models), sleep=sleeps.append)
        self.assertEqual(service.gerar_relatorio('Métricas'), 'Parecer final')
        self.assertEqual(len(models.calls), 2)
        self.assertEqual(sleeps, [5])

    def test_empty_result_does_not_count_as_report(self):
        models = FakeModels(['   '])
        with self.assertRaises(RelatorioIndisponivel):
            IAService(client=SimpleNamespace(models=models), sleep=lambda _: None).gerar_relatorio('Métricas')

    def test_missing_key_is_rejected_without_client_creation(self):
        with patch.dict('os.environ', {'GEMINI_API_KEY': ''}):
            with self.assertRaises(RelatorioIndisponivel):
                IAService(sleep=lambda _: None).gerar_relatorio('Métricas')

    def test_empty_summary_rejected(self):
        with self.assertRaises(RelatorioIndisponivel):
            IAService(client=SimpleNamespace(models=FakeModels([]))).gerar_relatorio('  ')


if __name__ == '__main__':
    unittest.main()
