"""Create the original Company Survey Platform schema baseline."""

from alembic import op
import sqlalchemy as sa

revision = "20260807_01"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create original tables so existing databases can be stamped to this known baseline."""
    op.create_table("roles", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("role_name", sa.String(length=50), nullable=False, unique=True))
    op.create_table("users", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("employee_id", sa.String(length=10), nullable=False, unique=True), sa.Column("full_name", sa.String(length=100), nullable=False), sa.Column("email", sa.String(length=255), nullable=False, unique=True), sa.Column("password_hash", sa.String(length=255), nullable=False), sa.Column("role", sa.String(length=20), nullable=False), sa.Column("department", sa.String(length=100), nullable=False), sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False))
    op.create_table("surveys", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("title", sa.String(length=200), nullable=False), sa.Column("description", sa.Text()), sa.Column("created_by", sa.Integer(), sa.ForeignKey("users.id"), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False), sa.Column("is_published", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.create_table("questions", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("survey_id", sa.Integer(), sa.ForeignKey("surveys.id"), nullable=False), sa.Column("question_text", sa.Text(), nullable=False), sa.Column("question_type", sa.String(length=50), nullable=False), sa.Column("display_order", sa.Integer(), nullable=False), sa.Column("is_required", sa.Boolean(), nullable=False, server_default=sa.true()), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False))
    op.create_table("responses", sa.Column("id", sa.Integer(), primary_key=True), sa.Column("survey_id", sa.Integer(), sa.ForeignKey("surveys.id"), nullable=False), sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False), sa.Column("question_id", sa.Integer(), sa.ForeignKey("questions.id"), nullable=False), sa.Column("answer", sa.Text(), nullable=False), sa.Column("created_at", sa.DateTime(), nullable=False), sa.Column("updated_at", sa.DateTime(), nullable=False))


def downgrade() -> None:
    """Remove schema objects in dependency order for a complete rollback."""
    op.drop_table("responses"); op.drop_table("questions"); op.drop_table("surveys"); op.drop_table("users"); op.drop_table("roles")
