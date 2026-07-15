import os

from dotenv import load_dotenv
from google import genai

from app.ai.prompts import ANALISE_GRAFO_PROMPT

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


class IAService:

    def gerar_relatorio(self, resumo):

        try:

            resposta = client.models.generate_content(
                model="gemini-3.5-flash",
                contents=f"""
{ANALISE_GRAFO_PROMPT}

Dados da análise:

{resumo}
"""
            )

            return resposta.text

        except Exception as erro:

            return f"Erro ao gerar relatório: {erro}"