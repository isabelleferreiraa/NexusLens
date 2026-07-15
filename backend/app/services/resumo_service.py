def gerar_resumo(metricas, analise, score):
    """
    Organiza as informações que serão enviadas para a IA.
    """

    return f"""
Resumo da análise da rede financeira

Quantidade de clientes: {metricas["quantidade_nos"]}
Quantidade de transações: {metricas["quantidade_arestas"]}

Score de risco: {score}/100

Nível de risco: {analise["nivel_risco"]}
Nível de influência: {analise["nivel_influencia"]}
Quantidade de conexões: {analise["quantidade_conexoes"]}
Papel na rede: {analise["papel_na_rede"]}

Gere um parecer executivo curto, explicando o significado desse score e indicando se o cliente deve ser monitorado, investigado ou apenas acompanhado.
"""