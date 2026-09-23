from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User


def lock_access_configuration(db: Session):
    # Serialize access changes so concurrent requests cannot remove the last admin.
    db.query(Role).order_by(Role.id).with_for_update().all()
    db.query(User).order_by(User.id).with_for_update().all()


def protect_last_access_manager(db: Session):
    db.flush()
    capable_role = (
        Role.permissions.any(Permission.key == "role.manage")
        & Role.permissions.any(Permission.key == "user.manage")
    )
    if not db.query(User).filter(
        User.is_active.is_(True), User.assigned_role.has(capable_role)
    ).first():
        db.rollback()
        raise HTTPException(409, "Keep at least one active user with both role.manage and user.manage permissions.")


def get_role(db: Session, role_id: int):
    role = db.get(Role, role_id)
    if role is None:
        raise HTTPException(400, "Selected role does not exist")
    return role


def commit_access_change(db: Session):
    try:
        protect_last_access_manager(db)
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "This change conflicts with existing users or roles.")


def save_role(db: Session, data, role_id: int | None = None):
    lock_access_configuration(db)
    role = get_role(db, role_id) if role_id is not None else Role()
    duplicate = db.query(Role).filter(func.lower(Role.role_name) == data.role_name.lower())
    if role_id is not None:
        duplicate = duplicate.filter(Role.id != role_id)
    if duplicate.first():
        raise HTTPException(409, "A role with that name already exists")
    permissions = db.query(Permission).filter(Permission.id.in_(data.permission_ids)).all()
    if len(permissions) != len(data.permission_ids):
        raise HTTPException(400, "One or more permission IDs do not exist")
    role.role_name = data.role_name
    role.permissions = permissions
    db.add(role)
    # Keep the legacy label synchronized for rollback compatibility.
    if role_id is not None:
        for user in db.query(User).filter(User.role_id == role_id):
            user.role = data.role_name
    commit_access_change(db)
    db.refresh(role)
    return role


def delete_role(db: Session, role_id: int):
    lock_access_configuration(db)
    role = get_role(db, role_id)
    if db.query(User).filter(User.role_id == role_id).first():
        raise HTTPException(409, "Reassign this role's users before deleting it")
    db.delete(role)
    commit_access_change(db)


def assign_role(db: Session, user_id: int, role_id: int):
    lock_access_configuration(db)
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(404, "User not found")
    role = get_role(db, role_id)
    user.assigned_role = role
    user.role = role.role_name
    commit_access_change(db)
    db.refresh(user)
    return user
