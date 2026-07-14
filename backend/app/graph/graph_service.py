import networkx as nx


def criar_grafo(transacoes):

    grafo = nx.DiGraph()

    for transacao in transacoes:

        origem = str(transacao.id_cliente_origem)
        destino = str(transacao.id_cliente_destino)

        grafo.add_edge(
            origem,
            destino,
            valor=float(transacao.valor)
        )

    return grafo


def calcular_metricas(grafo):

    return {

        "quantidade_nos": grafo.number_of_nodes(),

        "quantidade_arestas": grafo.number_of_edges(),

        "pagerank": nx.pagerank(grafo),

        "degree": dict(grafo.degree()),

        "betweenness": nx.betweenness_centrality(grafo),

        "closeness": nx.closeness_centrality(grafo)
    }