from sqlalchemy import Column, String, Date
from sqlalchemy.dialects.postgresql import UUID

from app.database.database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    id_cliente = Column(UUID(as_uuid=True), primary_key=True)

    cpf = Column(String(11))
    nome = Column(String(150))
    email = Column(String(150))
    telefone = Column(String(20))

    data_nascimento = Column(Date)

    cidade = Column(String(100))
    estado = Column(String(2))