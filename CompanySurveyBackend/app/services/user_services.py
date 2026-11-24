from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from app.models.user import User
from app.models.survey import Survey
from app.schemas.user import PasswordUpdate, UserCreate, UserUpdate
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.auth import pwd_context, verify_password, create_access_token

from app.services.role_services import get_role, lock_access_configuration, commit_access_change, protect_last_access_manager


def ensure_unique_user(db, employee_id, email, exclude_id=None):
    query = db.query(User.id).filter(or_(
        func.lower(User.employee_id) == employee_id.lower(),
        func.lower(User.email) == email.lower(),
    ))
    if exclude_id is not None:
        query = query.filter(User.id != exclude_id)
    if query.first():
        raise HTTPException(status_code=400, detail="Employee ID or email already exists.")


def create_user(db: Session, user: UserCreate):
    lock_access_configuration(db)
    role = get_role(db, user.role_id)
    ensure_unique_user(db, user.employee_id, user.email)
    hashed_password = pwd_context.hash(user.password)

    db_user = User(
        employee_id=user.employee_id,
        full_name=user.full_name,
        email=user.email,
        password_hash=hashed_password,
        role=role.role_name,
        assigned_role=role,
        department=user.department,
        is_active=user.is_active,
    )

    db.add(db_user)

    try:
        protect_last_access_manager(db)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Employee ID or email already exists.",
        )

    db.refresh(db_user)

    return db_user


def get_all_users(db: Session):
    return db.query(User).order_by(User.id).all()


def get_user_by_id(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def update_user(db: Session, user_id: int, user: UserUpdate):
    lock_access_configuration(db)
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        return None

    role = get_role(db, user.role_id)
    employee_id = user.employee_id if user.employee_id is not None else db_user.employee_id
    ensure_unique_user(db, employee_id, user.email, exclude_id=user_id)
    db_user.employee_id = employee_id
    if "is_active" in user.model_fields_set:
        db_user.is_active = user.is_active
    db_user.full_name = user.full_name
    db_user.email = user.email
    db_user.role = role.role_name
    db_user.assigned_role = role
    db_user.department = user.department

    try:
        protect_last_access_manager(db)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Employee ID or email already exists.",
        )

    db.refresh(db_user)

    return db_user


def delete_user(db: Session, user_id: int):
    lock_access_configuration(db)
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        return None

    if db.query(Survey.id).filter(Survey.created_by == user_id).first():
        raise HTTPException(
            status_code=409,
            detail="This user owns surveys and cannot be deleted while those surveys exist.",
        )

    db.delete(db_user)
    commit_access_change(db)

    return db_user


def update_current_user_password(db: Session, user_id: int, password_data: PasswordUpdate):
    db_user = db.query(User).filter(User.id == user_id).first()

    if db_user is None:
        return None

    if not verify_password(password_data.current_password, db_user.password_hash):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect.",
        )

    if password_data.current_password == password_data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from the current password.",
        )

    db_user.password_hash = pwd_context.hash(password_data.new_password)
    db.commit()
    db.refresh(db_user)

    return db_user


def login_user(db: Session, form_data: OAuth2PasswordRequestForm):
    """
    Login user using email and password.
    """

    email = form_data.username.strip().lower()
    password = form_data.password.strip()

    if (
        not email
        or not password
        or any(character.isspace() for character in email)
        or any(character.isspace() for character in password)
    ):
        return None

    user = db.query(User).filter(func.lower(User.email) == email).first()

    if user is None or not user.is_active:
        return None

    if not verify_password(password, user.password_hash):
        return None

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }
