"""Read-only, bounded read model for the IBM AML-Data synthetic demonstration sample.

No rows, tables, labels or data from the existing NexusLens dataset are modified.
The simulator's `is_laundering_label` is deliberately never retrieved by the API.
"""

from __future__ import annotations

from datetime import datetime

import networkx as nx
from sqlalchemy import inspect, text

from app.services.risco_service import calcular_risco
from app.services.score_service import calcular_score

DATASET_ID = "ibm-aml-hi-small"
DATASET_LABEL = "IBM AML-Data HI-Small (sintético)"
DISPLAY_CURRENCY = "USD"
ORIGINAL_CURRENCY = "US Dollar"


def imported_tables_exist(db) -> bool:
    bind = db.get_bind()
    inspector = inspect(bind)
    return inspector.has_table("ibm_aml_accounts") and inspector.has_table("ibm_aml_transactions")


def dataset_status(db) -> dict:
    if not imported_tables_exist(db):
        return {
            "dataset": DATASET_ID,
            "fonte": DATASET_LABEL,
            "disponivel": False,
            "situacao": "nao_importado",
            "total_contas": 0,
            "total_transacoes": 0,
            "moeda": DISPLAY_CURRENCY,
            "dados_sinteticos": True,
        }

    total_accounts = db.execute(text("""
        SELECT COUNT(*) FROM ibm_aml_accounts
        WHERE dataset_id = :dataset
          AND account_id IN (
            SELECT origin_id FROM ibm_aml_transactions
             WHERE dataset_id = :dataset AND payment_currency = :currency
               AND receiving_currency = :currency
            UNION
            SELECT destination_id FROM ibm_aml_transactions
             WHERE dataset_id = :dataset AND payment_currency = :currency
               AND receiving_currency = :currency
          )
    """), {"dataset": DATASET_ID, "currency": ORIGINAL_CURRENCY}).scalar_one()
    total_transactions = db.execute(text(
        "SELECT COUNT(*) FROM ibm_aml_transactions "
        "WHERE dataset_id = :dataset "
        "AND payment_currency = :currency AND receiving_currency = :currency"
    ), {"dataset": DATASET_ID, "currency": ORIGINAL_CURRENCY}).scalar_one()
    available = total_transactions > 0
    return {
        "dataset": DATASET_ID,
        "fonte": DATASET_LABEL,
        "disponivel": available,
        "situacao": "pronto" if available else "vazio",
        "total_contas": total_accounts,
        "total_transacoes": total_transactions,
        "moeda": DISPLAY_CURRENCY,
        "dados_sinteticos": True,
    }


def _read_transactions(db, limit: int, offset: int = 0):
    return db.execute(text("""
        SELECT transaction_id, origin_id, destination_id, occurred_at,
               amount_paid, payment_currency, payment_format
        FROM ibm_aml_transactions
        WHERE dataset_id = :dataset
          AND payment_currency = :currency AND receiving_currency = :currency
        ORDER BY occurred_at ASC, transaction_id ASC
        LIMIT :limit OFFSET :offset
    """), {"dataset": DATASET_ID, "currency": ORIGINAL_CURRENCY,
            "limit": limit, "offset": offset}).mappings().all()


def _iso(value):
    if isinstance(value, datetime):
        return value.isoformat(timespec="seconds")
    return str(value).replace(" ", "T") if value is not None else None


def _payment(row):
    return {
        "id_transacao": row["transaction_id"],
        "origem": row["origin_id"],
        "destino": row["destination_id"],
        "valor": float(row["amount_paid"]),
        "moeda": DISPLAY_CURRENCY,
        "data_transacao": _iso(row["occurred_at"]),
        "tipo_transacao": row["payment_format"],
    }


def list_transactions(db, *, limit=100, offset=0) -> dict:
    status = dataset_status(db)
    if not status["disponivel"]:
        return {**status, "limit": limit, "offset": offset, "transacoes": []}
    payments = [_payment(row) for row in _read_transactions(db, limit=limit, offset=offset)]
    return {**status, "limit": limit, "offset": offset, "transacoes": payments}


def _risco_por_conta(metrics, account_id) -> str:
    # Mirrors the classification thresholds already used by GET /grafo.
    pr = metrics["pagerank"].get(account_id, 0)
    deg = metrics["degree"].get(account_id, 0)
    bw = metrics["betweenness"].get(account_id, 0)
    score = (2 if pr >= 0.20 else 1 if pr >= 0.10 else 0)
    score += 2 if deg >= 15 else 1 if deg >= 8 else 0
    score += 2 if bw >= 0.30 else 1 if bw >= 0.10 else 0
    return "Alto" if score >= 5 else "Médio" if score >= 3 else "Baixo"


def build_graph(db, *, limit=1500) -> dict:
    status = dataset_status(db)
    if not status["disponivel"]:
        return {**status, "nos": [], "arestas": [], "metricas": None,
                "score_risco": None, "classificacao": None, "recomendacao": None,
                "transacoes_no_recorte": 0, "recorte_parcial": False}

    source_rows = _read_transactions(db, limit=limit)
    # Account IDs are opaque synthetic references, not actual persons.
    account_rows = db.execute(text("""
        SELECT account_id, bank_ref, account_ref
        FROM ibm_aml_accounts
        WHERE dataset_id = :dataset
    """), {"dataset": DATASET_ID}).mappings().all()
    account_by_id = {item["account_id"]: item for item in account_rows}

    graph = nx.DiGraph()
    transactions = []
    for row in source_rows:
        transaction = _payment(row)
        source, target = transaction["origem"], transaction["destino"]
        graph.add_edge(source, target)  # Unique directed relationships for centrality.
        transactions.append({
            "id": transaction["id_transacao"], "origem": source,
            "destino": target, "valor": transaction["valor"],
            "moeda": DISPLAY_CURRENCY, "data_transacao": transaction["data_transacao"],
            "tipo_transacao": transaction["tipo_transacao"],
        })

    if graph.number_of_nodes() == 0:
        return {**status, "nos": [], "arestas": [], "metricas": None,
                "score_risco": None, "classificacao": None, "recomendacao": None,
                "transacoes_no_recorte": 0, "recorte_parcial": False}

    # A 220-account sample is small enough for these exact NetworkX metrics.
    pagerank = nx.pagerank(graph)
    degree = dict(graph.degree())
    betweenness = nx.betweenness_centrality(graph)
    metrics = {
        "pagerank": pagerank,
        "degree": degree,
        "betweenness": betweenness,
        "quantidade_nos": graph.number_of_nodes(),
        "quantidade_arestas": graph.number_of_edges(),
    }
    analysis = calcular_risco(metrics)
    score = calcular_score(metrics, analysis)
    accounts = []
    for account_id in sorted(graph.nodes()):
        acc = account_by_id.get(account_id)
        account_ref = str(acc["account_ref"]) if acc else ""
        suffix = account_ref[-4:] if account_ref else account_id[-4:]
        accounts.append({
            "id": account_id,
            "nome": f"Conta ···{suffix}",
            "risco": _risco_por_conta(metrics, account_id),
        })
    return {
        **status,
        "nos": accounts,
        "arestas": transactions,
        "score_risco": score,
        "classificacao": analysis["nivel_risco"],
        "recomendacao": "Revisar as conexões e validar os sinais com um analista.",
        "metricas": {
            "quantidade_nos": metrics["quantidade_nos"],
            "quantidade_arestas": metrics["quantidade_arestas"],
            "nivel_influencia": analysis["nivel_influencia"],
            "quantidade_conexoes": analysis["quantidade_conexoes"],
            "papel_na_rede": analysis["papel_na_rede"],
        },
        "transacoes_no_recorte": len(transactions),
        "recorte_parcial": len(transactions) < status["total_transacoes"],
    }
