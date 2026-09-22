import os

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
from ops_pilot.schemas.auth_schema import Token,TokenData,UserCreate

from dotenv import load_dotenv
load_dotenv()

# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES")) # pyright: ignore[reportArgumentType]

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code here
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown code here


password_hash = PasswordHash.recommended()

DUMMY_HASH = password_hash.hash("dummy_password")

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

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
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM]) # pyright: ignore[reportArgumentType]
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


@app.post('/login')
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

@app.post("/register",response_model=UserResponse)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if the user already exists in the database or not
    existing_user = get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )
    hashed_password = password_hash.hash(user.password)
    db_user = UserModel(email=user.email, hashed_password=hashed_password, first_name=user.first_name, last_name=user.last_name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user
    