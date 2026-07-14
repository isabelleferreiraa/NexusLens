from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.cliente import Cliente
from app.schemas.cliente import ClienteResponse

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