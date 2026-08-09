"""Add database-level integrity constraints and query indexes."""

from alembic import op

revision = "20260807_02"
down_revision = "20260807_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add indexes and duplicate-prevention constraints after the baseline is established."""
    op.create_index("ix_users_department", "users", ["department"])
    op.create_index("ix_surveys_created_by", "surveys", ["created_by"])
    op.create_index("ix_surveys_is_published", "surveys", ["is_published"])
    op.create_index("ix_surveys_published_created", "surveys", ["is_published", "created_at"])
    op.create_index("ix_questions_survey_id", "questions", ["survey_id"])
    op.create_index("ix_questions_survey_display_order", "questions", ["survey_id", "display_order"])
    op.create_unique_constraint("uq_questions_survey_display_order", "questions", ["survey_id", "display_order"])
    op.create_index("ix_responses_survey_id", "responses", ["survey_id"])
    op.create_index("ix_responses_question_id", "responses", ["question_id"])
    op.create_index("ix_responses_survey_user", "responses", ["survey_id", "user_id"])
    op.create_unique_constraint("uq_responses_survey_user_question", "responses", ["survey_id", "user_id", "question_id"])


def downgrade() -> None:
    """Remove Phase 1 database optimization objects in reverse dependency order."""
    op.drop_constraint("uq_responses_survey_user_question", "responses", type_="unique")
    op.drop_index("ix_responses_survey_user", table_name="responses")
    op.drop_index("ix_responses_question_id", table_name="responses")
    op.drop_index("ix_responses_survey_id", table_name="responses")
    op.drop_constraint("uq_questions_survey_display_order", "questions", type_="unique")
    op.drop_index("ix_questions_survey_display_order", table_name="questions")
    op.drop_index("ix_questions_survey_id", table_name="questions")
    op.drop_index("ix_surveys_published_created", table_name="surveys")
    op.drop_index("ix_surveys_is_published", table_name="surveys")
    op.drop_index("ix_surveys_created_by", table_name="surveys")
    op.drop_index("ix_users_department", table_name="users")
