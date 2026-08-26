from fastapi import FastAPI, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.auth.routes import router as auth_router

# Models
from app.models.cliente import Cliente
from app.models.transacao import Transacao
from app.models.usuario import Usuario

# Schemas
from app.schemas.cliente import ClienteResponse

# Serviços
from app.graph.graph_service import criar_grafo, calcular_metricas
from app.services.risco_service import calcular_risco
from app.services.score_service import calcular_score
from app.services.resumo_service import gerar_resumo

# IA
from app.ai.ia_service import IAService

app = FastAPI(
    title="NexusLens API",
    version="1.0.0",
    description="Plataforma de análise de grafos com IA."
)

# Rotas de autenticação
app.include_router(auth_router)

# ===========================
# CORS
# ===========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://nexuslens-frontend.vercel.app",
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

    grafo = criar_grafo(transacoes)

    metricas = calcular_metricas(grafo)

    analise = calcular_risco(metricas)

    score = calcular_score(metricas, analise)

    classificacao = analise["nivel_risco"]

    if score >= 80:
        recomendacao = "Investigar imediatamente"
    elif score >= 50:
        recomendacao = "Monitorar novas transações"
    else:
        recomendacao = "Sem ação imediata"

    clientes = db.query(Cliente).all()

    nos = []

    for c in clientes:

        node_id = str(c.id_cliente)

        pr = metricas["pagerank"].get(node_id, 0)
        deg = metricas["degree"].get(node_id, 0)
        bw = metricas["betweenness"].get(node_id, 0)

        score_no = 0

        if pr >= 0.20:
            score_no += 2
        elif pr >= 0.10:
            score_no += 1

        if deg >= 15:
            score_no += 2
        elif deg >= 8:
            score_no += 1

        if bw >= 0.30:
            score_no += 2
        elif bw >= 0.10:
            score_no += 1

        risco_no = "Baixo"

        if score_no >= 5:
            risco_no = "Alto"
        elif score_no >= 3:
            risco_no = "Médio"

        nos.append({
            "id": node_id,
            "nome": c.nome,
            "risco": risco_no
        })

    arestas = [
        {
            "id": f"e-{t.id_cliente_origem}-{t.id_cliente_destino}-{i}",
            "origem": str(t.id_cliente_origem),
            "destino": str(t.id_cliente_destino),
            "valor": float(t.valor)
        }
        for i, t in enumerate(transacoes)
    ]

    return {
        "score_risco": score,
        "classificacao": classificacao,
        "recomendacao": recomendacao,
        "metricas": {
            "quantidade_nos": metricas["quantidade_nos"],
            "quantidade_arestas": metricas["quantidade_arestas"],
            "nivel_influencia": analise["nivel_influencia"],
            "quantidade_conexoes": analise["quantidade_conexoes"],
            "papel_na_rede": analise["papel_na_rede"]
        },
        "nos": nos,
        "arestas": arestas
    }


@app.post("/relatorio")
def gerar_relatorio(dados: dict = Body(...)):

    resumo = gerar_resumo(
        {
            "quantidade_nos": dados["metricas"]["quantidade_nos"],
            "quantidade_arestas": dados["metricas"]["quantidade_arestas"]
        },
        {
            "nivel_risco": dados["classificacao"],
            "nivel_influencia": dados["metricas"]["nivel_influencia"],
            "quantidade_conexoes": dados["metricas"]["quantidade_conexoes"],
            "papel_na_rede": dados["metricas"]["papel_na_rede"]
        },
        dados["score_risco"]
    )

    ia = IAService()

    relatorio = ia.gerar_relatorio(resumo)

    return {
        "relatorio": relatorio
    }