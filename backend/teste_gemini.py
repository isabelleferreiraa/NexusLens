from google import genai
from dotenv import load_dotenv
import os

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

resposta = client.models.generate_content(
    model="gemini-3.5-flash",
    contents="Responda apenas com a palavra OK."
)

print(resposta.text)