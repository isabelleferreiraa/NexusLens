from sqlalchemy import Column, String, Numeric, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.database.database import Base


class Transacao(Base):
    __tablename__ = "transacoes"

    id_transacao = Column(UUID(as_uuid=True), primary_key=True)

    id_cliente_origem = Column(UUID(as_uuid=True), nullable=False)
    id_cliente_destino = Column(UUID(as_uuid=True), nullable=False)

    valor = Column(Numeric(15, 2))

    tipo_transacao = Column(String(20))

    data_transacao = Column(DateTime)