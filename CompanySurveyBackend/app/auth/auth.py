from datetime import datetime, timedelta, UTC
from jose import jwt, JWTError
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from fastapi.security import OAuth2PasswordBearer
import os
from dotenv import load_dotenv

load_dotenv()
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/users/login")

def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.now(UTC) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt

def decode_access_token(token:str):

    try:
        payload = jwt.decode(

            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        return payload
    
    except JWTError:

        return None

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code= status.HTTP_401_UNAUTHORIZED,
            detail="iNVALID token"
        )
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid token"
    )

    user = db.query(User).filter(User.id == int(user_id)).first()

    if user is None:
        raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="User not found"
        )


    return user
    
