from fastapi import Depends, HTTPException

from app.auth.auth import get_current_user
from app.models.user import User
from app.permission_catalog import PERMISSIONS, SURVEY_ACCESS


def has_permission(user: User, key: str) -> bool:
    return key in user.permissions


def can_view_all_surveys(user: User) -> bool:
    return bool(SURVEY_ACCESS.intersection(user.permissions))


def require_permission(key: str):
    if key not in PERMISSIONS:
        raise ValueError(f"Unknown permission: {key}")

    def check(current_user: User = Depends(get_current_user)) -> User:
        if not has_permission(current_user, key):
            raise HTTPException(status_code=403, detail=f"Permission required: {key}")
        return current_user

    return check


def require_survey_access(current_user: User = Depends(get_current_user)) -> User:
    if not can_view_all_surveys(current_user):
        raise HTTPException(status_code=403, detail="Survey access is required")
    return current_user


# Compatibility alias for older imports; never checks a role name.
require_admin = require_permission("user.manage")
