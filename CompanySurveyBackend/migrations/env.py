"""Configure Alembic to use the application's database URL and ORM metadata."""

from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from app.database.database import Base, DATABASE_URL
from app.models.question import Question
from app.models.response import Response
from app.models.role import Role
from app.models.survey import Survey
from app.models.user import User

config = context.config

# Never store database credentials in alembic.ini; load them from the existing environment configuration.
config.set_main_option("sqlalchemy.url", DATABASE_URL)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Generate SQL without connecting to the database when Alembic runs offline."""
    context.configure(url=config.get_main_option("sqlalchemy.url"), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run versioned schema changes against the configured PostgreSQL database."""
    connectable = engine_from_config(config.get_section(config.config_ini_section, {}), prefix="sqlalchemy.", poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
