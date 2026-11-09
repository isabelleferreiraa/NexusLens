"""Contrato mínimo para emissão de parecer a partir de métricas agregadas IBM.

Nunca exige nem permite transações, contas, nomes ou rótulos do simulador.
"""

from pydantic import BaseModel, ConfigDict, Field


class MetricasRelatorio(BaseModel):
    model_config = ConfigDict(extra='forbid')

    quantidade_nos: int = Field(ge=0)
    quantidade_arestas: int = Field(ge=0)
    nivel_influencia: str = Field(min_length=1, max_length=100)
    quantidade_conexoes: str = Field(min_length=1, max_length=100)
    papel_na_rede: str = Field(min_length=1, max_length=200)


class RelatorioRequest(BaseModel):
    model_config = ConfigDict(extra='forbid')

    score_risco: float = Field(ge=0, le=100, allow_inf_nan=False)
    classificacao: str = Field(min_length=1, max_length=80)
    metricas: MetricasRelatorio
