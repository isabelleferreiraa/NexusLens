"""Read-only smoke check for the IBM AML-Data API.

No database write/import is performed. Exit 2 means the dataset has not been
imported; exit 1 means an unhealthy/inconsistent API; exit 0 means ready.
"""

from __future__ import annotations

import argparse
import json
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen

PREFIX = "datasets/ibm-aml/"


def fetch_json(url: str) -> dict:
    request = Request(url, headers={"Accept": "application/json"}, method="GET")
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def check(base_url: str, *, fetch=fetch_json) -> tuple[int, str]:
    """Validate the public API contract; never inspect laundering ground truth."""
    if not base_url.startswith(("http://127.0.0.1:", "http://localhost:", "https://")):
        return 1, "Use uma URL http local ou https para a API."
    base = base_url.rstrip("/") + "/"

    try:
        status = fetch(urljoin(base, PREFIX + "status"))
        if not isinstance(status, dict) or status.get("dataset") != "ibm-aml-hi-small":
            return 1, "O endpoint /status não retornou o dataset esperado."
        if status.get("disponivel") is False:
            return 2, f"Dataset não disponível neste banco: {status.get('situacao', 'desconhecido')}."
        if status.get("disponivel") is not True or status.get("moeda") != "USD":
            return 1, "O endpoint /status retornou disponibilidade ou moeda inválida."

        transactions = fetch(urljoin(base, PREFIX + "transacoes?limit=20&offset=0"))
        graph = fetch(urljoin(base, PREFIX + "grafo?limit=1500"))
        if any(not isinstance(obj, dict) for obj in (transactions, graph)):
            return 1, "Respostas inválidas dos endpoints IBM."
        if any(obj.get("disponivel") is not True or obj.get("moeda") != "USD" for obj in (transactions, graph)):
            return 1, "A API retornou fontes ou moedas inconsistentes."
        rows = transactions.get("transacoes")
        nodes, edges = graph.get("nos"), graph.get("arestas")
        if not isinstance(rows, list) or not isinstance(nodes, list) or not isinstance(edges, list):
            return 1, "A listagem ou o grafo não é uma lista válida."
        if not rows or not nodes or not edges:
            return 1, "O dataset está marcado como pronto, mas a API não forneceu transações/grafo."
        if len(rows) > 20 or len(edges) > 1500:
            return 1, "O endpoint não respeitou o limite de registros."
        if graph.get("transacoes_no_recorte") != len(edges):
            return 1, "A quantidade de transações do grafo está inconsistente."
        if any(row.get("moeda") != "USD" for row in rows + edges):
            return 1, "Foram encontradas movimentações com outra moeda."
        if any(not isinstance(row.get("valor"), (int, float)) for row in rows + edges):
            return 1, "Alguma transação não possui um valor numérico."
        node_ids = {node.get("id") for node in nodes}
        if any(edge.get("origem") not in node_ids or edge.get("destino") not in node_ids for edge in edges):
            return 1, "Uma aresta aponta para uma conta ausente no grafo."
        if "is_laundering_label" in json.dumps((transactions, graph)):
            return 1, "Rótulo do simulador exposto pela API pública."
        if not isinstance(graph.get("metricas"), dict) or graph.get("score_risco") is None:
            return 1, "Métricas do grafo indisponíveis."
        return 0, (f"IBM AML pronta: {status.get('total_transacoes')} transações importadas; "
                   f"{len(nodes)} contas e {len(edges)} transações no grafo; moeda USD.")
    except (URLError, HTTPError, OSError, ValueError, TypeError) as exc:
        return 1, f"Falha ao consultar a API: {type(exc).__name__}: {exc}"


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", default="http://127.0.0.1:8000", help="URL da API FastAPI")
    args = parser.parse_args(argv)
    code, message = check(args.base_url)
    print(message)
    return code


if __name__ == "__main__":
    raise SystemExit(main())
