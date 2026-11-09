"""Prepare and optionally import a bounded, connected IBM AML-Data HI-Small sample.

The default execution is a dry-run. No database connection is made without --apply.
No real-world person or banking records are involved: IBM AML-Data is synthetic.
"""

from __future__ import annotations

import argparse
import csv
import json
import os
import random
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal, InvalidOperation
from pathlib import Path

HEADER = [
    "Timestamp", "From Bank", "Account", "To Bank", "Account",
    "Amount Received", "Receiving Currency", "Amount Paid",
    "Payment Currency", "Payment Format", "Is Laundering",
]
DATASET = "ibm-aml-hi-small"
DEFAULT_CURRENCY = "US Dollar"


@dataclass(frozen=True)
class Record:
    line: int
    origin: str
    destination: str
    from_bank: str
    to_bank: str
    from_account: str
    to_account: str
    occurred_at: datetime
    amount_paid: Decimal
    amount_received: Decimal
    currency: str
    payment_format: str
    labeled_laundering: bool

    @property
    def stable_id(self) -> str:
        return f"{DATASET}:{self.line}"


def account_id(bank: str, account: str) -> str:
    """Bank + account are jointly required to avoid accidental collisions."""
    return f"bank:{bank.strip()}|account:{account.strip()}"


def read_rows(csv_path: Path):
    with csv_path.open("r", newline="", encoding="utf-8-sig") as file:
        reader = csv.reader(file)
        header = next(reader, None)
        if header != HEADER:
            raise ValueError(
                "Cabeçalho inesperado. Use o arquivo original HI-Small_Trans.csv "
                "da IBM (duas colunas Account). Cabeçalho recebido: " + repr(header)
            )
        for line, raw in enumerate(reader, 1):
            if len(raw) != 11:
                continue
            yield line, raw


def parse_record(line: int, fields: list[str], currency: str) -> Record | None:
    if fields[6].strip() != currency or fields[8].strip() != currency:
        return None  # Do not mix currency units or silently convert FX rates.
    bank_from, account_from = fields[1].strip(), fields[2].strip()
    bank_to, account_to = fields[3].strip(), fields[4].strip()
    if not all((bank_from, account_from, bank_to, account_to)):
        return None
    try:
        sent = Decimal(fields[7].strip())
        received = Decimal(fields[5].strip())
        if not (sent.is_finite() and received.is_finite() and sent >= 0 and received >= 0):
            return None
        timestamp = datetime.strptime(fields[0].strip(), "%Y/%m/%d %H:%M")
        laundering = fields[10].strip()
        if laundering not in {"0", "1"}:
            return None
    except (InvalidOperation, ValueError):
        return None
    return Record(
        line=line,
        origin=account_id(bank_from, account_from),
        destination=account_id(bank_to, account_to),
        from_bank=bank_from, to_bank=bank_to,
        from_account=account_from, to_account=account_to,
        occurred_at=timestamp,
        amount_paid=sent,
        amount_received=received,
        currency=currency,
        payment_format=fields[9].strip()[:64],
        labeled_laundering=laundering == "1",
    )


def choose_sample(csv_path: Path, max_transactions=1500, max_accounts=220,
                  labeled_seeds=20, random_seed=42, currency=DEFAULT_CURRENCY):
    """Two streaming passes: seed from labeled synthetic examples, expand their neighborhoods.

    This is a deliberately enriched demonstration sample, NOT an unbiased evaluation set.
    """
    if not csv_path.is_file():
        raise FileNotFoundError(f"Arquivo ausente: {csv_path}")
    if not (1 <= labeled_seeds <= max_transactions and 2 * labeled_seeds <= max_accounts):
        raise ValueError("Amostra inválida: seeds devem caber em max-transactions/max-accounts")

    rng = random.Random(random_seed)
    seeds: list[Record] = []
    first_eligible: Record | None = None
    labels_seen = 0
    valid_seen = 0
    # Pass 1: stream the entire source; reservoir sample labeled rows.
    for index, raw in read_rows(csv_path):
        row = parse_record(index, raw, currency)
        if row is None:
            continue
        valid_seen += 1
        if first_eligible is None:
            first_eligible = row
        if not row.labeled_laundering:
            continue
        labels_seen += 1
        if len(seeds) < labeled_seeds:
            seeds.append(row)
        else:
            pos = rng.randrange(labels_seen)
            if pos < labeled_seeds:
                seeds[pos] = row

    if not first_eligible:
        raise ValueError(f"Nenhuma transação válida na moeda {currency!r}; verifique o CSV.")
    if not seeds:
        # A perfectly legitimate custom fixture can have no positives.
        seeds = [first_eligible]

    selected = {row.line: row for row in seeds}
    seed_accounts = {account for row in seeds for account in (row.origin, row.destination)}
    involved = set(seed_accounts)
    # Pass 2: add genuine neighboring transactions from any seed account.
    # Limits protect the free-tier backend / browser graph.
    for index, raw in read_rows(csv_path):
        if len(selected) >= max_transactions:
            break
        if index in selected:
            continue
        row = parse_record(index, raw, currency)
        if row is None or (row.origin not in seed_accounts and row.destination not in seed_accounts):
            continue
        new_accounts = {row.origin, row.destination} - involved
        if len(involved) + len(new_accounts) > max_accounts:
            continue
        involved.update(new_accounts)
        selected[index] = row
    rows = [selected[index] for index in sorted(selected)]
    return rows, {
        "dataset": DATASET,
        "source": "IBM AML-Data HI-Small (synthetic)",
        "currency": currency,
        "eligible_csv_rows": valid_seen,
        "eligible_labeled_rows": labels_seen,
        "selected_transactions": len(rows),
        "selected_accounts": len({a for r in rows for a in (r.origin, r.destination)}),
        "selected_labeled_rows": sum(r.labeled_laundering for r in rows),
        "selection": "labeled-seed neighborhood demo (not a statistical sample)",
    }


def connect_postgres():
    try:
        import psycopg2
    except ImportError as exc:
        raise RuntimeError("Instale backend/requirements.txt para importar ao PostgreSQL") from exc

    database_url = os.getenv("DATABASE_URL")
    if database_url:
        return psycopg2.connect(database_url, connect_timeout=20)
    required = {"host": "DB_HOST", "port": "DB_PORT", "dbname": "DB_NAME",
                "user": "DB_USER", "password": "DB_PASSWORD"}
    options = {arg: os.getenv(env) for arg, env in required.items()}
    missing = [required[k] for k, v in options.items() if not v]
    if missing:
        raise RuntimeError("Credenciais ausentes: configure DATABASE_URL ou " + ", ".join(missing))
    return psycopg2.connect(**options, sslmode="require", connect_timeout=20)


def import_to_database(rows: list[Record], schema_file: Path):
    """Only called when the operator passed --apply. No DELETE, DROP or overwrite."""
    if not rows:
        raise ValueError("Não há linhas para importar")
    import psycopg2.extras
    conn = connect_postgres()
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(schema_file.read_text(encoding="utf-8"))
                accounts = {}
                for row in rows:
                    accounts[row.origin] = (row.origin, DATASET, row.from_bank, row.from_account)
                    accounts[row.destination] = (row.destination, DATASET, row.to_bank, row.to_account)
                psycopg2.extras.execute_values(cur,
                    "INSERT INTO ibm_aml_accounts (account_id, dataset_id, bank_ref, account_ref) "
                    "VALUES %s ON CONFLICT (account_id) DO NOTHING",
                    list(accounts.values()), page_size=500)
                transactions = [(
                    row.stable_id, DATASET, row.origin, row.destination,
                    row.occurred_at, row.amount_paid, row.currency,
                    row.amount_received, row.currency, row.payment_format,
                    row.labeled_laundering,
                ) for row in rows]
                psycopg2.extras.execute_values(cur,
                    "INSERT INTO ibm_aml_transactions (transaction_id, dataset_id, origin_id, "
                    "destination_id, occurred_at, amount_paid, payment_currency, "
                    "amount_received, receiving_currency, payment_format, is_laundering_label) "
                    "VALUES %s ON CONFLICT (transaction_id) DO NOTHING",
                    transactions, page_size=500)
    finally:
        conn.close()


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--csv", type=Path, required=True, help="HI-Small_Trans.csv, baixado da IBM")
    parser.add_argument("--max-transactions", type=int, default=1500)
    parser.add_argument("--max-accounts", type=int, default=220)
    parser.add_argument("--labeled-seeds", type=int, default=20)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--currency", default=DEFAULT_CURRENCY)
    parser.add_argument("--apply", action="store_true", help="Escrever tabelas separadas no PostgreSQL")
    args = parser.parse_args(argv)
    rows, report = choose_sample(args.csv, args.max_transactions, args.max_accounts,
                                  args.labeled_seeds, args.seed, args.currency)
    print(json.dumps(report, ensure_ascii=False, indent=2))
    if not args.apply:
        print("DRY RUN: nenhuma alteração feita no banco. Use --apply para importar.")
        return
    sql_path = Path(__file__).resolve().parents[2] / "database" / "ibm_aml_schema.sql"
    if not sql_path.is_file():
        raise FileNotFoundError(f"Esquema SQL não encontrado: {sql_path}")
    import_to_database(rows, sql_path)
    print("Importação concluída em tabelas separadas. Dados antigos não foram modificados.")


if __name__ == "__main__":
    main()
