from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.database.database import SessionLocal

# Models
from app.models.cliente import Cliente
from app.models.transacao import Transacao

# Schemas
from app.schemas.cliente import ClienteResponse

# IA
from app.ai.ia_service import IAService

# Serviços
from app.graph.graph_service import criar_grafo, calcular_metricas
from app.services.risco_service import calcular_risco
from app.services.score_service import calcular_score
from app.services.resumo_service import gerar_resumo


app = FastAPI(
    title="NexusLens API",
    version="1.0.0",
    description="Plataforma de análise de grafos com IA."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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

    # Cria o grafo
    grafo = criar_grafo(transacoes)

    # Calcula as métricas
    metricas = calcular_metricas(grafo)

    # Analisa o risco
    analise = calcular_risco(metricas)

    # Calcula o score
    score = calcular_score(metricas, analise)

    # Classificação
    classificacao = analise["nivel_risco"]

    # Recomendação baseada no score
    if score >= 80:
        recomendacao = "Investigar imediatamente"
    elif score >= 50:
        recomendacao = "Monitorar novas transações"
    else:
        recomendacao = "Sem ação imediata"

    # Resumo enviado para a IA
    resumo = gerar_resumo(metricas, analise, score)

    # Geração do relatório
    ia = IAService()
    relatorio = ia.gerar_relatorio(resumo)

    return {
        "score_risco": score,
        "classificacao": classificacao,
        "recomendacao": recomendacao,
        "metricas": {
            "nivel_influencia": analise["nivel_influencia"],
            "quantidade_conexoes": analise["quantidade_conexoes"],
            "papel_na_rede": analise["papel_na_rede"]
        },
        "relatorio": relatorio
    }