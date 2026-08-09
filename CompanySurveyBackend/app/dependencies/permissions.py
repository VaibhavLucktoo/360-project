from fastapi import Depends, HTTPException, status

from app.auth.auth import get_current_user
from app.models.user import User

def is_admin(user: User) -> bool:
    """Return whether the authenticated user may administer platform content."""
    return user.role.strip().lower() == "admin"


def can_manage_survey(user: User, created_by: int) -> bool:
    # Survey ownership no longer grants privileges: managers respond as employees.
    return is_admin(user)


def require_management_user(current_user: User = Depends(get_current_user)) -> User:
    """Keep the existing dependency name while enforcing admin-only management."""
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access is required")
    return current_user


def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Restrict user administration to platform administrators."""
    if not is_admin(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access is required")
    return current_user
