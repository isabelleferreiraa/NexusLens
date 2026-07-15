def calcular_risco(metricas):
    """
    Interpreta as métricas do grafo e gera uma classificação
    de risco baseada em regras de negócio.
    """

    pagerank = max(metricas["pagerank"].values(), default=0)
    degree = max(metricas["degree"].values(), default=0)
    betweenness = max(metricas["betweenness"].values(), default=0)

    # ----------------------------
    # Nível de influência
    # ----------------------------

    if pagerank >= 0.20:
        influencia = "Alta"
    elif pagerank >= 0.10:
        influencia = "Média"
    else:
        influencia = "Baixa"

    # ----------------------------
    # Quantidade de conexões
    # ----------------------------

    if degree >= 15:
        conexoes = "Elevada"
    elif degree >= 8:
        conexoes = "Moderada"
    else:
        conexoes = "Baixa"

    # ----------------------------
    # Papel na rede
    # ----------------------------

    if betweenness >= 0.30:
        papel = "Intermediador"
    elif betweenness >= 0.10:
        papel = "Participante relevante"
    else:
        papel = "Participação comum"

    # ----------------------------
    # Score de risco
    # ----------------------------

    score = 0

    if influencia == "Alta":
        score += 2
    elif influencia == "Média":
        score += 1

    if conexoes == "Elevada":
        score += 2
    elif conexoes == "Moderada":
        score += 1

    if papel == "Intermediador":
        score += 2
    elif papel == "Participante relevante":
        score += 1

    # ----------------------------
    # Classificação final
    # ----------------------------

    if score >= 5:
        risco = "Alto"
    elif score >= 3:
        risco = "Médio"
    else:
        risco = "Baixo"

    return {
        "nivel_risco": risco,
        "nivel_influencia": influencia,
        "quantidade_conexoes": conexoes,
        "papel_na_rede": papel
    }