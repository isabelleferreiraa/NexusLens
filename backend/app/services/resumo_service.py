def gerar_resumo(metricas, analise, score):
    """Resumo estrutural agregado enviado ao modelo de linguagem."""

    return f"""
Resumo de métricas agregadas da rede financeira

Contas representadas no grafo: {metricas["quantidade_nos"]}
Conexões representadas no grafo: {metricas["quantidade_arestas"]}

Score heurístico da rede: {score}/100

Classificação heurística: {analise["nivel_risco"]}
Maior nível de influência observado: {analise["nivel_influencia"]}
Categoria de conexões: {analise["quantidade_conexoes"]}
Papel estrutural predominante no resumo: {analise["papel_na_rede"]}

Não foram fornecidos dados de horários, padrões individuais ou evidência de fraude.
Gere um parecer exploratório da rede e sugira validações para o analista.
"""
