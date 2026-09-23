"""Exercise revision 05 in a temporary PostgreSQL schema, then roll it all back.

Run from CompanySurveyBackend: python -m scripts.check_role_migration
No application data is changed.
"""
import importlib.util
from pathlib import Path
from uuid import uuid4

import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations

from app.database.database import engine


def main():
    path = Path(__file__).resolve().parents[1] / "migrations/versions/20260922_05_dynamic_roles.py"
    spec = importlib.util.spec_from_file_location("role_migration", path)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)
    schema = "rbac_check_" + uuid4().hex
    with engine.connect() as connection:
        transaction = connection.begin()
        try:
            connection.execute(sa.text(f'CREATE SCHEMA "{schema}"'))
            connection.execute(sa.text(f'SET LOCAL search_path TO "{schema}"'))
            connection.execute(sa.text("CREATE TABLE roles (id SERIAL PRIMARY KEY, role_name VARCHAR(50) UNIQUE NOT NULL)"))
            connection.execute(sa.text("CREATE TABLE users (id SERIAL PRIMARY KEY, role VARCHAR(20) NOT NULL)"))
            connection.execute(sa.text("INSERT INTO roles(role_name) VALUES ('Admin'), ('admin'), (' Employee ')"))
            connection.execute(sa.text("INSERT INTO users(role) VALUES ('ADMIN'), (' employee '), ('manager'), ('Custom')"))
            with Operations.context(MigrationContext.configure(connection)):
                migration.upgrade()
                assert connection.execute(sa.text("SELECT COUNT(*) FROM users WHERE role_id IS NULL")).scalar_one() == 0
                assert connection.execute(sa.text("SELECT COUNT(*) FROM permissions")).scalar_one() == len(migration.CATALOG)
                grants = connection.execute(sa.text("""SELECT r.role_name, COUNT(rp.permission_id)
                    FROM roles r LEFT JOIN role_permissions rp ON rp.role_id=r.id
                    GROUP BY r.role_name""")).all()
                assert dict(grants) == {"admin": len(migration.CATALOG), "employee": 0, "manager": 0, "custom": 0}
                connection.execute(sa.text("INSERT INTO roles(role_name) VALUES ('A newly created role with a long name')"))
                connection.execute(sa.text("""INSERT INTO users(role, role_id)
                    SELECT role_name, id FROM roles WHERE role_name='A newly created role with a long name'"""))
                migration.downgrade()
                assert connection.execute(sa.text("SELECT COUNT(*) FROM users")).scalar_one() == 5
                assert connection.execute(sa.text("SELECT COUNT(*) FROM users WHERE role='employee'")).scalar_one() == 3
            print("Role migration upgrade, backfill, case variants, and downgrade passed.")
        finally:
            transaction.rollback()


if __name__ == "__main__":
    main()
