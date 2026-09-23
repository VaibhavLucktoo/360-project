
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.database import Base


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer,primary_key = True, index= True)
    title = Column(String(200), nullable =False)
    description = Column(Text,nullable=True)
    created_by = Column(Integer,ForeignKey("users.id"), nullable= False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    is_published = Column(Boolean, default= False, index=True)
    creator = relationship("User", back_populates="surveys")
    questions = relationship(
        "Question",
        back_populates="survey",
        cascade="all, delete-orphan",
    )
    responses = relationship("Response", back_populates="survey")

    # Supports the published-survey list used by employee dashboards.
    __table_args__ = (Index("ix_surveys_published_created", "is_published", "created_at"),)


