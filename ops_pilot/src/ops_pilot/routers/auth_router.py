from typing import Annotated

from fastapi import APIRouter, Depends, Request, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ops_pilot.database import get_db
from ops_pilot.models.auth_model import UserModel
from ops_pilot.schemas.auth_schema import (
	RefreshTokenRequest,
	TokenResponse,
	UserCreateRequest,
	UserResponse,
	UserUpdateRequest,
)
from ops_pilot.services import auth_service

from ops_pilot.core.rate_limiter import limiter

router = APIRouter()

@router.post("/login")
@limiter.limit("5/minute")
async def login_for_access_token(
    request: Request,
	form_data: Annotated[OAuth2PasswordRequestForm, Depends()],response:Response, db: Session = Depends(get_db)
):
	return auth_service.login(db, form_data.username, form_data.password, response)


@router.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: UserModel = Depends(auth_service.get_current_user)):
	return current_user


@router.patch("/users/me", response_model=UserResponse)
@limiter.limit("5/minute")
def update_users_me(
	request: Request,
	user_data: UserUpdateRequest,
	current_user: UserModel = Depends(auth_service.get_current_user),
	db: Session = Depends(get_db),
):
	return auth_service.update_user(db, current_user, user_data)


@router.post("/register", response_model=UserResponse)
@limiter.limit("5/minute")
def register_user(request: Request, user: UserCreateRequest, db: Session = Depends(get_db)):
	return auth_service.register(db, user)


@router.post("/auth/refresh", response_model=TokenResponse)
def refresh_access_token(request_: Request, response: Response, db: Session = Depends(get_db)):
	return auth_service.refresh(db, request_, response)


@router.post("/auth/logout")
def logout(request: RefreshTokenRequest, db: Session = Depends(get_db)):
	return auth_service.logout(db, request.refresh_token)
