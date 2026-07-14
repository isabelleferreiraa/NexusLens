from fastapi import FastAPI

app = FastAPI(
    title="NexusLens API",
    version="1.0.0",
    description="Plataforma de análise de grafos com Inteligência Artificial."
)


@app.get("/")
def home():
    return {
        "status": "online",
        "mensagem": "Bem-vindo ao NexusLens!"
    }