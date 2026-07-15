import os
import time

from dotenv import load_dotenv
from google import genai

from app.ai.prompts import ANALISE_GRAFO_PROMPT

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)


class IAService:

    def gerar_relatorio(self, resumo):

        tentativas = 3

        for tentativa in range(tentativas):

            try:

                resposta = client.models.generate_content(
                    model="gemini-flash-latest",
                    contents=f"""
{ANALISE_GRAFO_PROMPT}

Dados da análise:

{resumo}
"""
                )

                return resposta.text

            except Exception as erro:

                mensagem = str(erro)

                print(f"Tentativa {tentativa + 1}: {mensagem}")

                # Aguarda antes de tentar novamente apenas se for erro temporário
                if (
                    "503" in mensagem
                    or "429" in mensagem
                    or "RESOURCE_EXHAUSTED" in mensagem
                    or "UNAVAILABLE" in mensagem
                ) and tentativa < tentativas - 1:

                    time.sleep(5)
                    continue

                break

        return (
            "Não foi possível gerar o relatório da IA neste momento. "
            "Tente novamente em alguns instantes."
        )