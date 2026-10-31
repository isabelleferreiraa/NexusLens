def calcular_score(metricas, analise):
    """
    Calcula pontuação heurística de 0 a 100 para a estrutura da rede.

    ATENÇÃO: centralidade de grafo não equivale a probabilidade de fraude.
    A pontuação serve somente para priorizar revisão exploratória.
    O argumento `metricas` é mantido por compatibilidade com o endpoint atual.
    """
    score = 0

    if analise["nivel_influencia"] == "Alta":
        score += 35
    elif analise["nivel_influencia"] == "Média":
        score += 20
    else:
        score += 10

    # Alinhado aos rótulos produzidos pelo risco_service:
    # "Elevada", "Moderada" e "Baixa".
    if analise["quantidade_conexoes"] == "Elevada":
        score += 30
    elif analise["quantidade_conexoes"] == "Moderada":
        score += 20
    else:
        score += 10

    if analise["papel_na_rede"] == "Intermediador":
        score += 20
    else:
        score += 10

    if analise["nivel_risco"] == "Alto":
        score += 15
    elif analise["nivel_risco"] == "Médio":
        score += 10
    else:
        score += 5

    return min(score, 100)
