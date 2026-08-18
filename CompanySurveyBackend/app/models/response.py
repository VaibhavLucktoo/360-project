from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    Index,
    UniqueConstraint,
    String,
)

from sqlalchemy.orm import relationship

from datetime import datetime

from app.database.database import Base


class Response(Base):

    __tablename__ = "responses"

    # ===========================================
    # Primary Key
    # ===========================================

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # ===========================================
    # Survey
    # ===========================================

    survey_id = Column(
        Integer,
        ForeignKey("surveys.id"),
        nullable=False,
        index=True
    )

    # ===========================================
    # Optional Logged-in User
    # ===========================================

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    # ===========================================
    # Anonymous Submission Identifier
    # ===========================================

    submission_id = Column(
        String(36),
        nullable=False,
        index=True
    )

    # ===========================================
    # Question
    # ===========================================

    question_id = Column(
        Integer,
        ForeignKey("questions.id"),
        nullable=False,
        index=True
    )

    # ===========================================
    # Answer
    # ===========================================

    answer = Column(
        Text,
        nullable=False
    )

    # ===========================================
    # Timestamps
    # ===========================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # ===========================================
    # Relationships
    # ===========================================

    user = relationship(
        "User",
        back_populates="responses"
    )

    question = relationship(
        "Question",
        back_populates="responses"
    )

    survey = relationship(
        "Survey",
        back_populates="responses"
    )

    # ===========================================
    # Constraints / Indexes
    # ===========================================

    __table_args__ = (

        UniqueConstraint(
            "survey_id",
            "submission_id",
            "question_id",
            name="uq_responses_survey_submission_question"
        ),

        Index(
            "ix_responses_survey_submission",
            "survey_id",
            "submission_id"
        ),

    )