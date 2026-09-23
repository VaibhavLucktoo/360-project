"""Restore response indexes missing from databases already stamped at revision 03."""

from alembic import op
import sqlalchemy as sa


revision = "20260922_04"
down_revision = "20260807_03"
branch_labels = None
depends_on = None


def upgrade() -> None:
    existing = {
        index["name"]: index
        for index in sa.inspect(op.get_bind()).get_indexes("responses")
    }
    for name, columns in (
        ("ix_responses_submission_id", ["submission_id"]),
        ("ix_responses_survey_submission", ["survey_id", "submission_id"]),
    ):
        if name not in existing:
            op.create_index(name, "responses", columns, unique=False)
        elif existing[name]["column_names"] != columns or existing[name]["unique"]:
            raise RuntimeError(f"Index {name} exists with an unexpected definition")


def downgrade() -> None:
    # Both indexes belong to revision 03 and must remain when returning to it.
    pass
