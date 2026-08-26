from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

import jwt

from app.database.database import SessionLocal
from app.models.usuario import Usuario
from app.schemas.auth import UsuarioCreate, UsuarioLogin, TokenResponse
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    SECRET_KEY,
    ALGORITHM
)

router = APIRouter(prefix="/auth", tags=["Autenticação"])

security = HTTPBearer()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register")
def register(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db)
):
    usuario_existente = db.query(Usuario).filter(
        Usuario.email == usuario.email
    ).first()

    if usuario_existente:
        raise HTTPException(
            status_code=400,
            detail="E-mail já cadastrado"
        )

    novo_usuario = Usuario(
        nome=usuario.nome,
        email=usuario.email,
        password_hash=hash_password(usuario.password)
    )

    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)

    return {
        "mensagem": "Usuário cadastrado com sucesso",
        "email": novo_usuario.email
    }


@router.post("/login", response_model=TokenResponse)
def login(
    usuario: UsuarioLogin,
    db: Session = Depends(get_db)
):
    usuario_db = db.query(Usuario).filter(
        Usuario.email == usuario.email
    ).first()

    if not usuario_db:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos"
        )

    senha_valida = verify_password(
        usuario.password,
        usuario_db.password_hash
    )

    if not senha_valida:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha inválidos"
        )

    token = create_access_token(usuario_db.email)

    return {
        "access_token": token,
        "token_type": "bearer"
    }


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if not email:
            raise HTTPException(
                status_code=401,
                detail="Token inválido"
            )

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expirado"
        )

    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token inválido"
        )

    usuario = db.query(Usuario).filter(
        Usuario.email == email
    ).first()

    if not usuario:
        raise HTTPException(
            status_code=401,
            detail="Usuário não encontrado"
        )

    return usuario