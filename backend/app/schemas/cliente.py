from datetime import date
from uuid import UUID

from pydantic import BaseModel


class ClienteResponse(BaseModel):
    id_cliente: UUID
    nome: str
    cpf: str
    email: str
    telefone: str | None
    data_nascimento: date
    cidade: str | None
    estado: str | None

    class Config:
        from_attributes = True