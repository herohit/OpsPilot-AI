from ops_pilot.models.auth_model import UserModel
from ops_pilot.schemas.auth_schema import UserResponse
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException,status
from contextlib import asynccontextmanager
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
import jwt 
from sqlalchemy import select
from datetime import timedelta,datetime,timezone

from ops_pilot.database import get_db,Base,engine
from sqlalchemy.orm import Session

from ops_pilot.models.auth_model import UserModel
from ops_pilot.schemas.auth_schema import Token,TokenData

# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code here
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown code here


password_hash = PasswordHash.recommended()

DUMMY_HASH = password_hash.hash("dummy_password")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI(lifespan=lifespan)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return password_hash.verify(plain_password, hashed_password)

def authenticate_user(db: Session, username: str, password: str):
    # Check if username -> email exist in db
    stmt = select(UserModel).where(UserModel.email == username)
    user = db.scalar(stmt)
    if not user:
        verify_password(password, DUMMY_HASH)
        return False
    # If exists, verify the password
    if not verify_password(password, user.hashed_password):
        return False
    # Return user object if authentication is successful, else return None
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_user_by_email(db: Session, email: str):
    stmt = select(UserModel).where(UserModel.email == email)
    return db.scalar(stmt)

def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    user = get_user_by_email(db, token_data.username)
    if user is None:
        raise credentials_exception
    return user


@app.post('/token')
async def login_for_access_token(form_data :Annotated[OAuth2PasswordRequestForm, Depends()],db:Session = Depends(get_db)):
    username = form_data.username
    password = form_data.password
    # Here you would normally verify the username and password
    user = authenticate_user(db,username, password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(data={"sub": user.email}, expires_delta=access_token_expires)
    return Token(access_token=access_token, token_type="bearer")

@app.get("/users/me", response_model=UserResponse)
async def read_users_me(current_user: UserModel = Depends(get_current_user)):
    return current_user
    