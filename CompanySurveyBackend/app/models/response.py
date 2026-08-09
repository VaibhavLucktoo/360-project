from sqlalchemy import Column, Integer, DateTime, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base


class Response(Base):

    __tablename__ = "responses"

    id = Column(Integer, primary_key=True, index=True)

    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False, index=True)

    answer = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    user = relationship("User", back_populates="responses")

    question = relationship("Question", back_populates="responses")

    survey = relationship("Survey", back_populates="responses")

    # Enforces duplicate prevention even if two submission requests arrive together.
    __table_args__ = (
        UniqueConstraint("survey_id", "user_id", "question_id", name="uq_responses_survey_user_question"),
        Index("ix_responses_survey_user", "survey_id", "user_id"),
    )
