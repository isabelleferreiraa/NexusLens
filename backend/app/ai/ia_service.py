"""Geração de pareceres: Gemini redige texto, não investiga ou detecta fraude.

Falhas do provedor NÃO são devolvidas como se fossem pareceres bem-sucedidos.
A chave de API é lida somente quando se gera um relatório (não no startup).
"""

import os
import time

from dotenv import load_dotenv

from app.ai.prompts import ANALISE_GRAFO_PROMPT

load_dotenv()


class RelatorioIndisponivel(RuntimeError):
    """O Gemini não produziu um texto utilizável neste momento."""


class IAService:
    def __init__(self, client=None, sleep=time.sleep, max_attempts=3):
        self._client = client
        self._sleep = sleep
        self._max_attempts = max_attempts

    def gerar_relatorio(self, resumo):
        if not isinstance(resumo, str) or not resumo.strip():
            raise RelatorioIndisponivel('Resumo de análise vazio.')

        if self._client is not None:
            client = self._client
        else:
            key = os.getenv('GEMINI_API_KEY')
            if not key:
                raise RelatorioIndisponivel('Chave Gemini não configurada.')
            try:
                from google import genai
                client = genai.Client(api_key=key)
            except Exception as exc:
                raise RelatorioIndisponivel('Não foi possível preparar o Gemini.') from exc

        for attempt in range(self._max_attempts):
            try:
                response = client.models.generate_content(
                    model='gemini-flash-latest',
                    contents=f'{ANALISE_GRAFO_PROMPT}\n\nDados da análise:\n\n{resumo}',
                )
                relatorio = getattr(response, 'text', None)
                if not isinstance(relatorio, str) or not relatorio.strip():
                    raise RelatorioIndisponivel('O Gemini retornou texto vazio.')
                return relatorio.strip()
            except RelatorioIndisponivel:
                # An empty or blocked answer is not a transient infrastructure error.
                raise
            except Exception as exc:
                message = str(exc).upper()
                is_transient = any(code in message for code in (
                    '429', '503', 'RESOURCE_EXHAUSTED', 'UNAVAILABLE', 'DEADLINE_EXCEEDED'
                ))
                if is_transient and attempt < self._max_attempts - 1:
                    self._sleep(5)
                    continue
                # Do not expose raw provider errors, which may contain request details.
                raise RelatorioIndisponivel('Serviço de geração indisponível.') from exc

        raise RelatorioIndisponivel('Serviço de geração indisponível.')
