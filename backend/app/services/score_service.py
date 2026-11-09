"""Calcular o score estrutural de 0 a 100 a partir de categorias heurísticas.

O serviço de risco usa categorias de conexões "Elevada", "Moderada" e
"Baixa". Elas devem ser respeitadas; antes eram testadas como "Alta/Média",
subestimando o componente de conexões em redes IBM.
"""


def calcular_score(metricas, analise):
    influencia = analise["nivel_influencia"]
    conexoes = analise["quantidade_conexoes"]
    papel = analise["papel_na_rede"]
    risco = analise["nivel_risco"]

    score = {"Alta": 35, "Média": 20}.get(influencia, 10)
    score += {"Elevada": 30, "Moderada": 20}.get(conexoes, 10)
    score += 20 if papel == "Intermediador" else 10
    score += {"Alto": 15, "Médio": 10}.get(risco, 5)
    return min(score, 100)
