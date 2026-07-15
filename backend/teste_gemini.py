from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

try:

    resposta = client.models.generate_content(
        model="gemini-flash-latest",
        contents="Explique em duas frases o que é risco financeiro."
    )

    print("\nResposta da IA:\n")
    print(resposta.text)

except Exception as erro:

    print("\nErro:\n")
    print(erro)