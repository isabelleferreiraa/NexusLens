from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.models.transacao import Transacao
from app.database.database import SessionLocal
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteResponse
from app.graph.graph_service import criar_grafo
from app.graph.graph_service import calcular_metricas

app = FastAPI(
    title="NexusLens API",
    version="1.0.0",
    description="Plataforma de análise de grafos com IA."
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {
        "status": "online",
        "mensagem": "Bem-vindo ao NexusLens!"
    }


@app.get("/clientes", response_model=list[ClienteResponse])
def listar_clientes(db: Session = Depends(get_db)):
    return db.query(Cliente).all()

@app.get("/transacoes")
def listar_transacoes(db: Session = Depends(get_db)):
    transacoes = db.query(Transacao).all()

    return [
        {
            "origem": str(t.id_cliente_origem),
            "destino": str(t.id_cliente_destino),
            "valor": float(t.valor)
        }
        for t in transacoes
    ]

@app.get("/grafo")
def obter_grafo(db: Session = Depends(get_db)):

    transacoes = db.query(Transacao).all()

    grafo = criar_grafo(transacoes)

    metricas = calcular_metricas(grafo)

    return metricas