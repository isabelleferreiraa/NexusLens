def calcular_score(metricas, analise):
    """
    Calcula um score de risco de 0 a 100
    baseado nas métricas do grafo.
    """

    score = 0

    # Influência na rede
    if analise["nivel_influencia"] == "Alta":
        score += 35
    elif analise["nivel_influencia"] == "Média":
        score += 20
    else:
        score += 10

    # Quantidade de conexões
    if analise["quantidade_conexoes"] == "Alta":
        score += 30
    elif analise["quantidade_conexoes"] == "Média":
        score += 20
    else:
        score += 10

    # Papel do cliente na rede
    if analise["papel_na_rede"] == "Intermediador":
        score += 20
    else:
        score += 10

    # Nível de risco calculado pela engine
    if analise["nivel_risco"] == "Alto":
        score += 15
    elif analise["nivel_risco"] == "Médio":
        score += 10
    else:
        score += 5

    return min(score, 100)