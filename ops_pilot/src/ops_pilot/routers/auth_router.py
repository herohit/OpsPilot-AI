from typing import Annotated

from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ops_pilot.database import get_db
from ops_pilot.models.auth_model import UserModel
from ops_pilot.schemas.auth_schema import RefreshTokenRequest, TokenResponse, UserCreateRequest, UserResponse
from ops_pilot.services import auth_service

router = APIRouter()


@router.post("/login")
async def login_for_access_token(
	form_data: Annotated[OAuth2PasswordRequestForm, Depends()], db: Session = Depends(get_db)
):
	return auth_service.login(db, form_data.username, form_data.password)


@router.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: UserModel = Depends(auth_service.get_current_user)):
	return current_user


@router.post("/register", response_model=UserResponse)
def register_user(user: UserCreateRequest, db: Session = Depends(get_db)):
	return auth_service.register(db, user)


@router.post("/auth/refresh", response_model=TokenResponse)
def refresh_access_token(request: RefreshTokenRequest, db: Session = Depends(get_db)):
	return auth_service.refresh(db, request.refresh_token)


@router.post("/auth/logout")
def logout(request: RefreshTokenRequest, db: Session = Depends(get_db)):
	return auth_service.logout(db, request.refresh_token)
