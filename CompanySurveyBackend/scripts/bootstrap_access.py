"""Create an initial access administrator when none exists.

Run interactively after migrations: python -m scripts.bootstrap_access
The password is read without echo and is never logged.
"""
import os
from getpass import getpass

from sqlalchemy import and_

from app.database.database import SessionLocal
from app.models.permission import Permission
from app.models.role import Role
from app.models.user import User
from app.schemas.user import UserCreate
from app.services.role_services import lock_access_configuration
from app.services.user_services import create_user


def main():
    with SessionLocal() as db:
        capability = and_(
            Role.permissions.any(Permission.key == "role.manage"),
            Role.permissions.any(Permission.key == "user.manage"),
        )
        lock_access_configuration(db)
        if db.query(User).filter(User.is_active.is_(True), User.assigned_role.has(capability)).first():
            print("An active access administrator already exists. Use Roles and Users in the app.")
            return
        permissions = db.query(Permission).all()
        if not {"role.manage", "user.manage"}.issubset({item.key for item in permissions}):
            raise SystemExit("Run the database migrations first.")
        role = db.query(Role).filter(Role.role_name == "Access Administrator").first()
        if role is None:
            role = Role(role_name="Access Administrator")
            db.add(role)
        role.permissions = permissions
        db.flush()

        emp_id = os.getenv("ADMIN_EMP_ID") or input("Employee ID: ")
        full_name = os.getenv("ADMIN_FULL_NAME") or input("Full name: ")
        email = os.getenv("ADMIN_EMAIL") or input("Email: ")
        dept = os.getenv("ADMIN_DEPT") or input("Department: ")
        password = os.getenv("ADMIN_PASSWORD")
        if not password:
            password = getpass("Initial password (at least 8 characters, no spaces): ")

        data = UserCreate(
            employee_id=emp_id,
            full_name=full_name,
            email=email,
            department=dept,
            password=password,
            role_id=role.id,
        )
        create_user(db, data)
        print("Access administrator created. Log in and open Roles or Users.")


if __name__ == "__main__":
    main()
