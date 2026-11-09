"""Sinais explicáveis em transações sintéticas IBM AML-Data.

Estas regras NÃO comprovam crime, NÃO usam `is_laundering_label` e devem
ser calibradas antes de qualquer uso fora de demonstrações acadêmicas.
Operam apenas no recorte limitado da API, com transações de uma única moeda.
"""

from __future__ import annotations

from collections import defaultdict
from datetime import datetime, timedelta
from hashlib import sha256
from math import isfinite

MAX_EVENTS = 100


def _prepare(records):
    result = []
    seen = set()
    for row in records:
        src = str(row.get("origem") or "").strip()
        dst = str(row.get("destino") or "").strip()
        tid = str(row.get("id_transacao") or row.get("id") or "").strip()
        if not src or not dst or not tid or tid in seen or src == dst:
            continue
        if row.get("moeda") != "USD":
            continue
        try:
            timestamp = row.get("data_transacao")
            stamp = timestamp if isinstance(timestamp, datetime) else datetime.fromisoformat(timestamp)
            if stamp.tzinfo is not None:  # IBM timestamps have no timezone
                continue
            amount = float(row.get("valor"))
        except (TypeError, ValueError, OverflowError):
            continue
        if not isfinite(amount) or amount <= 0:
            continue
        seen.add(tid)
        result.append({"id": tid, "source": src, "target": dst, "time": stamp, "amount": amount})
    return sorted(result, key=lambda r: (r["time"], r["id"]))


def _signal(rule, title, severity, transactions, accounts, main_account, explanation):
    transactions = sorted(transactions, key=lambda row: (row["time"], row["id"]))
    ids = [r["id"] for r in transactions]
    digest = sha256((rule + ":" + "|".join(ids)).encode("utf-8")).hexdigest()[:16]
    return {
        "id": f"{rule}-{digest}",
        "regra": rule,
        "titulo": title,
        "nivel": severity,
        "descricao": explanation,
        "conta_principal": main_account,
        "contas": sorted(set(accounts)),
        "transacoes_ids": ids[:12],
        "quantidade_evidencias": len(ids),
        "valor_relacionado": round(sum(r["amount"] for r in transactions), 2),
        "moeda": "USD",
        "inicio": transactions[0]["time"].isoformat(timespec="seconds"),
        "fim": transactions[-1]["time"].isoformat(timespec="seconds"),
        "observacao": "Sinal heurístico para revisão humana; não comprova lavagem de dinheiro.",
    }


def detectar_sinais(transacoes, max_eventos=MAX_EVENTS):
    """Detecta até 100 eventos por recorte, com limites fixos e sem rótulos IBM.

    - Ida e volta: A→B e B→A dentro de 24h.
    - Distribuição: A→4 ou mais destinos diferentes dentro de 24h.
    - Ciclo temporal: A→B→C→A dentro de 72h, valores em proporção >=60%.
    """
    if not 1 <= max_eventos <= MAX_EVENTS:
        raise ValueError("max_eventos deve estar entre 1 e 100")
    rows = _prepare(transacoes)
    result = []
    by_src = defaultdict(list)
    by_pair = defaultdict(list)
    for row in rows:
        by_src[row["source"]].append(row)
        by_pair[(row["source"], row["target"])].append(row)

    # 1. Ida e volta. Uma evidência representativa por par de contas.
    processed = set()
    for (src, dst), forward in sorted(by_pair.items()):
        pair_key = tuple(sorted((src, dst)))
        if pair_key in processed:
            continue
        processed.add(pair_key)
        backward = by_pair.get((dst, src), [])
        if not backward:
            continue
        matched = next(((a, b) for a in forward for b in backward
                        if abs((a["time"] - b["time"]).total_seconds()) <= 24 * 3600), None)
        if matched:
            a, b = matched
            result.append(_signal("ida_volta_24h", "Transferências de ida e volta", "medio",
                                  [a, b], pair_key, src,
                                  "Movimentações em sentidos opostos entre duas contas em até 24 horas."))

    # 2. Distribuição rápida a diferentes destinos.
    for src, payments in sorted(by_src.items()):
        window_start = 0
        evidence = None
        for end, current in enumerate(payments):
            while payments[window_start]["time"] < current["time"] - timedelta(hours=24):
                window_start += 1
            active = payments[window_start:end + 1]
            destinations = {p["target"] for p in active}
            if len(destinations) >= 4:
                # One representative per account; avoid hundreds of overlapping alerts.
                evidence = active
                break
        if evidence:
            result.append(_signal("dispersao_24h", "Distribuição rápida a várias contas", "medio",
                                  evidence, [src, *(p["target"] for p in evidence)], src,
                                  "Uma conta transferiu valores para pelo menos quatro destinos distintos em 24 horas."))

    # 3. Directed 3-account cycles, respecting actual chronological order.
    seen_cycles = set()
    for first in rows:
        a, b = first["source"], first["target"]
        for second in by_src.get(b, ()):
            c = second["target"]
            if c in (a, b) or not first["time"] <= second["time"] <= first["time"] + timedelta(hours=72):
                continue
            if second["amount"] < first["amount"] * .6 or second["amount"] > first["amount"] / .6:
                continue
            for third in by_pair.get((c, a), ()):
                if not second["time"] <= third["time"] <= first["time"] + timedelta(hours=72):
                    continue
                values = (first["amount"], second["amount"], third["amount"])
                if min(values) < max(values) * .6:
                    continue
                cycle = tuple(sorted((a, b, c)))
                if cycle in seen_cycles:
                    continue
                seen_cycles.add(cycle)
                result.append(_signal("ciclo_72h", "Ciclo temporal entre três contas", "alto",
                                      [first, second, third], cycle, a,
                                      "Valores de magnitude próxima circularam entre três contas, retornando à origem em até 72 horas."))
                break
    priority = {"alto": 0, "medio": 1}
    result.sort(key=lambda s: (priority[s["nivel"]], s["inicio"], s["id"]))
    return result[:max_eventos]
