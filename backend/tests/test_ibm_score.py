"""Score regression: same category vocabulary as the backend risk service."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.score_service import calcular_score


class IbmScoreTests(unittest.TestCase):
    def test_elevated_connections_contribute_thirty_points(self):
        analysis = {'nivel_influencia': 'Alta', 'quantidade_conexoes': 'Elevada',
                    'papel_na_rede': 'Intermediador', 'nivel_risco': 'Alto'}
        self.assertEqual(calcular_score({}, analysis), 100)

    def test_moderate_connections_contribute_twenty_points(self):
        analysis = {'nivel_influencia': 'Média', 'quantidade_conexoes': 'Moderada',
                    'papel_na_rede': 'Participante relevante', 'nivel_risco': 'Médio'}
        self.assertEqual(calcular_score({}, analysis), 60)

    def test_low_risk_still_bounded_and_nonzero(self):
        analysis = {'nivel_influencia': 'Baixa', 'quantidade_conexoes': 'Baixa',
                    'papel_na_rede': 'Participação comum', 'nivel_risco': 'Baixo'}
        self.assertEqual(calcular_score({}, analysis), 35)


if __name__ == '__main__':
    unittest.main()
