from app.services.score_service import calcular_score


def test_score_alto_usa_conexoes_elevadas():
    analise = {
        "nivel_influencia": "Alta",
        "quantidade_conexoes": "Elevada",
        "papel_na_rede": "Intermediador",
        "nivel_risco": "Alto",
    }
    assert calcular_score({}, analise) == 100


def test_score_medio_usa_conexoes_moderadas():
    analise = {
        "nivel_influencia": "Média",
        "quantidade_conexoes": "Moderada",
        "papel_na_rede": "Participante relevante",
        "nivel_risco": "Médio",
    }
    assert calcular_score({}, analise) == 60


def test_score_baixo():
    analise = {
        "nivel_influencia": "Baixa",
        "quantidade_conexoes": "Baixa",
        "papel_na_rede": "Participação comum",
        "nivel_risco": "Baixo",
    }
    assert calcular_score({}, analise) == 35
