"""Optional read-only API for the IBM AML-Data synthetic dataset.

Routes do not mutate the original NexusLens PostgreSQL tables or read the
simulator's ground-truth laundering labels into the public interface.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.services.ibm_aml_service import build_graph, dataset_status, list_transactions

router = APIRouter(prefix="/datasets/ibm-aml", tags=["IBM AML-Data (sintético)"])


def get_ibm_db():
    # Late import keeps unit tests independent of production DB credentials.
    from app.database.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _safe_read(operation):
    try:
        return operation()
    except SQLAlchemyError as error:
        # Never return SQL errors or connection strings to API clients.
        raise HTTPException(status_code=503, detail="Banco do dataset indisponível.") from error


@router.get("/status")
def get_status(db: Session = Depends(get_ibm_db)):
    return _safe_read(lambda: dataset_status(db))


@router.get("/transacoes")
def get_transactions(
    limit: int = Query(100, ge=1, le=200),
    offset: int = Query(0, ge=0, le=10000),
    db: Session = Depends(get_ibm_db),
):
    return _safe_read(lambda: list_transactions(db, limit=limit, offset=offset))


@router.get("/grafo")
def get_graph(
    limit: int = Query(1500, ge=1, le=1500),
    db: Session = Depends(get_ibm_db),
):
    return _safe_read(lambda: build_graph(db, limit=limit))
