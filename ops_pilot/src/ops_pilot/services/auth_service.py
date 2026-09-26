import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from sqlalchemy import select
from sqlalchemy.orm import Session

from ops_pilot.database import get_db
from ops_pilot.models.auth_model import RefreshTokenModel, UserModel
from ops_pilot.schemas.auth_schema import TokenPayload, TokenResponse, UserCreateRequest

load_dotenv()


def get_required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


SECRET_KEY = get_required_env("SECRET_KEY")
ALGORITHM = get_required_env("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(get_required_env("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_TOKEN_EXPIRE_DAYS = int(get_required_env("REFRESH_TOKEN_EXPIRE_DAYS"))

password_hash = PasswordHash.recommended()
DUMMY_HASH = password_hash.hash("dummy_password")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")


def utc_now_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_utc_naive(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(timezone.utc).replace(tzinfo=None)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)


def authenticate_user(db: Session, username: str, password: str):
    user = get_user_by_email(db, username)
    if not user:
        verify_password(password, DUMMY_HASH)
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(db: Session, user: UserModel) -> str:
    secret = secrets.token_urlsafe(64)
    refresh_token_db = RefreshTokenModel(
        token_hash=password_hash.hash(secret),
        user_id=user.id,
        expires_at=utc_now_naive() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(refresh_token_db)
    db.commit()
    db.refresh(refresh_token_db)
    return f"{refresh_token_db.id}.{secret}"


def get_user_by_email(db: Session, email: str):
    return db.scalar(select(UserModel).where(UserModel.email == email))


def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not isinstance(username, str) or not username:
            raise credentials_exception
        token_data = TokenPayload(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user_by_email(db, token_data.username)
    if user is None:
        raise credentials_exception
    return user


def login(db: Session, username: str, password: str) -> TokenResponse:
    user = authenticate_user(db, username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_refresh_token(db, user)
    return TokenResponse(
        access_token=access_token, token_type="bearer", refresh_token=refresh_token
    )


def register(db: Session, user: UserCreateRequest) -> UserModel:
    if get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )
    db_user = UserModel(
        email=user.email,
        hashed_password=password_hash.hash(user.password),
        first_name=user.first_name,
        last_name=user.last_name,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def refresh(db: Session, refresh_token: str) -> TokenResponse:
    try:
        token_id, secret = refresh_token.split(".", 1)
        token_id = UUID(token_id)
    except ValueError, AttributeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    stored_token = db.get(RefreshTokenModel, token_id)
    if stored_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )
    if stored_token.revoked:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )
    if to_utc_naive(stored_token.expires_at) <= utc_now_naive():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired"
        )
    if not password_hash.verify(secret, stored_token.token_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    user = db.get(UserModel, stored_token.user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found"
        )
    stored_token.revoked = True
    access_token = create_access_token(
        data={"sub": user.email},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    new_refresh_token = create_refresh_token(db, user)
    db.commit()
    return TokenResponse(
        access_token=access_token, refresh_token=new_refresh_token, token_type="bearer"
    )


def logout(db: Session, refresh_token: str) -> dict[str, str]:
    try:
        token_id, _ = refresh_token.split(".", 1)
        token_id = UUID(token_id)
    except ValueError, AttributeError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    stored_token = db.get(RefreshTokenModel, token_id)
    if stored_token:
        stored_token.revoked = True
        db.commit()
    return {"message": "Successfully logged out"}
