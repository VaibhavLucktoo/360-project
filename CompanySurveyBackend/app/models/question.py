from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False, index=True)

    question_text = Column(Text, nullable=False)
    question_type = Column(String(50), nullable=False)

    display_order = Column(Integer, nullable=False)
    is_required = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    survey = relationship("Survey", back_populates="questions")
    responses = relationship("Response", back_populates="question")

    # A survey cannot have two questions at the same display position.
    __table_args__ = (
        UniqueConstraint("survey_id", "display_order", name="uq_questions_survey_display_order"),
        Index("ix_questions_survey_display_order", "survey_id", "display_order"),
    )
