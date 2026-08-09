from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.auth import verify_password, create_access_token

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)

    db_user = User(
        employee_id=user.employee_id,
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        department=user.department,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


def get_all_users(db: Session):
    return db.query(User).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def update_user(db: Session, user_id: int, user: UserUpdate):
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        return None

    db_user.full_name = user.full_name
    db_user.email = user.email
    db_user.role = user.role
    db_user.department = user.department

    db.commit()
    db.refresh(db_user)

    return db_user


def delete_user(db: Session, user_id: int):
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        return None

    db.delete(db_user)
    db.commit()

    return db_user


def login_user(db: Session, form_data: OAuth2PasswordRequestForm):
    """
    Login user using email and password.
    """

    user = db.query(User).filter(User.email == form_data.username).first()

    if user is None:
        return None

    if not verify_password(form_data.password, user.password_hash):
        return None

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }