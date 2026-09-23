"""Shared fixtures for isolated API tests using an in-memory SQLite database."""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database.database import Base, get_db
from app.main import app


@pytest.fixture()
def db_session():
    """Provide a clean database for every test without touching PostgreSQL data."""
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    session_factory = sessionmaker(bind=engine, autocommit=False, autoflush=False)
    Base.metadata.create_all(bind=engine)

    database_session = session_factory()
    from app.models.role import Role
    from app.models.permission import Permission
    from app.permission_catalog import PERMISSIONS
    permissions = [Permission(key=key, description=value) for key, value in PERMISSIONS.items()]
    database_session.add_all([
        Role(id=1, role_name="admin", permissions=permissions),
        Role(id=2, role_name="employee"),
        Role(id=3, role_name="manager"),
    ])
    database_session.commit()
    try:
        yield database_session
    finally:
        database_session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def client(db_session):
    """Provide an API client backed by the isolated test database."""
    session_factory = sessionmaker(bind=db_session.bind, autocommit=False, autoflush=False)

    def override_get_db():
        database_session = session_factory()
        try:
            yield database_session
        finally:
            database_session.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
