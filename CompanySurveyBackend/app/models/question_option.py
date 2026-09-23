from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database.database import Base


class QuestionOption(Base):
    __tablename__ = "question_options"

    id = Column(Integer, primary_key=True, index=True)

    # Every option belongs to one question.
    question_id = Column(
        Integer,
        ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Text shown to the survey respondent.
    option_text = Column(Text, nullable=False)

    # Controls option order in the form.
    display_order = Column(Integer, nullable=False)

    # Timestamps for the option.
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    question = relationship(
        "Question",
        back_populates="options",
    )

    __table_args__ = (
        # Two options cannot occupy the same position.
        UniqueConstraint(
            "question_id",
            "display_order",
            name="uq_question_options_question_display_order",
        ),
        Index(
            "ix_question_options_question_display_order",
            "question_id",
            "display_order",
        ),
    )