"""Add question options and anonymous survey submissions."""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text


revision = "20260807_03"
down_revision = "20260807_02"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Bring the migrated schema in line with the current survey models."""
    op.create_table(
        "question_options",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "question_id",
            sa.Integer(),
            sa.ForeignKey("questions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("option_text", sa.Text(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )
    op.create_index(
        "ix_question_options_id",
        "question_options",
        ["id"],
    )
    op.create_index(
        "ix_question_options_question_id",
        "question_options",
        ["question_id"],
    )
    op.create_index(
        "ix_question_options_question_display_order",
        "question_options",
        ["question_id", "display_order"],
    )
    op.create_unique_constraint(
        "uq_question_options_question_display_order",
        "question_options",
        ["question_id", "display_order"],
    )

    op.add_column(
        "responses",
        sa.Column("submission_id", sa.String(length=36), nullable=True),
    )

    connection = op.get_bind()
    connection.execute(
        text(
            "UPDATE responses "
            "SET submission_id = 'legacy-' || id::text "
            "WHERE submission_id IS NULL"
        )
    )

    op.alter_column(
        "responses",
        "submission_id",
        existing_type=sa.String(length=36),
        nullable=False,
    )
    op.create_index(
        "ix_responses_submission_id",
        "responses",
        ["submission_id"],
    )

    op.alter_column(
        "responses",
        "user_id",
        existing_type=sa.Integer(),
        nullable=True,
    )

    op.drop_constraint(
        "uq_responses_survey_user_question",
        "responses",
        type_="unique",
    )
    op.drop_index(
        "ix_responses_survey_user",
        table_name="responses",
    )

    op.create_index(
        "ix_responses_survey_submission",
        "responses",
        ["survey_id", "submission_id"],
    )
    op.create_unique_constraint(
        "uq_responses_survey_submission_question",
        "responses",
        ["survey_id", "submission_id", "question_id"],
    )


def downgrade() -> None:
    """Reverse anonymous submission and question option schema changes."""
    op.drop_constraint(
        "uq_responses_survey_submission_question",
        "responses",
        type_="unique",
    )
    op.drop_index(
        "ix_responses_survey_submission",
        table_name="responses",
    )

    op.drop_index(
        "ix_responses_submission_id",
        table_name="responses",
    )
    op.alter_column(
        "responses",
        "user_id",
        existing_type=sa.Integer(),
        nullable=False,
    )

    op.drop_column("responses", "submission_id")

    op.create_index(
        "ix_responses_survey_user",
        "responses",
        ["survey_id", "user_id"],
    )
    op.create_unique_constraint(
        "uq_responses_survey_user_question",
        "responses",
        ["survey_id", "user_id", "question_id"],
    )

    op.drop_constraint(
        "uq_question_options_question_display_order",
        "question_options",
        type_="unique",
    )
    op.drop_index(
        "ix_question_options_question_display_order",
        table_name="question_options",
    )
    op.drop_index(
        "ix_question_options_question_id",
        table_name="question_options",
    )
    op.drop_index(
        "ix_question_options_id",
        table_name="question_options",
    )
    op.drop_table("question_options")
