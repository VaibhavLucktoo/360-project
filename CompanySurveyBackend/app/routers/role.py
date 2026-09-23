from typing import Annotated
from fastapi import Path
from app.schemas.access_validation import MAX_DATABASE_ID

DatabaseId = Annotated[int, Path(gt=0, le=MAX_DATABASE_ID)]

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.auth import get_current_user
from app.database.database import get_db
from app.dependencies.permissions import has_permission, require_permission
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User
from app.schemas.role import PermissionResponse, RoleResponse, RoleWrite, RoleUpdate
from app.services.role_services import delete_role, save_role

router = APIRouter(prefix="/roles", tags=["Roles"])


@router.get("/permissions", response_model=list[PermissionResponse])
def list_permissions(db: Session = Depends(get_db), user: User = Depends(require_permission("role.manage"))):
    return db.query(Permission).order_by(Permission.key).all()


@router.get("/", response_model=list[RoleResponse])
def list_roles(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if not (has_permission(user, "role.manage") or has_permission(user, "user.manage")):
        raise HTTPException(403, "Role or user management permission is required")
    return db.query(Role).order_by(Role.role_name).all()


@router.post("/", response_model=RoleResponse, status_code=201)
def create_role(data: RoleWrite, db: Session = Depends(get_db), user: User = Depends(require_permission("role.manage"))):
    return save_role(db, data)


@router.put("/{role_id}", response_model=RoleResponse)
def update_role(role_id: DatabaseId, data: RoleUpdate, db: Session = Depends(get_db), user: User = Depends(require_permission("role.manage"))):
    if db.get(Role, role_id) is None:
        raise HTTPException(404, "Role not found")
    return save_role(db, data, role_id)


@router.delete("/{role_id}")
def remove_role(role_id: DatabaseId, db: Session = Depends(get_db), user: User = Depends(require_permission("role.manage"))):
    if db.get(Role, role_id) is None:
        raise HTTPException(404, "Role not found")
    delete_role(db, role_id)
    return {"message": "Role deleted successfully"}


@router.get("/{role_id}", response_model=RoleResponse)
def read_role(role_id: DatabaseId, db: Session = Depends(get_db), user: User = Depends(require_permission("role.manage"))):
    role = db.get(Role, role_id)
    if role is None:
        raise HTTPException(404, "Role not found")
    return role
