from pydantic import BaseModel, Field, field_validator
from datetime import datetime
from app.schemas.question import QuestionResponse

class SurveyWithQuestions(BaseModel):
    id: int
    title: str
    description: str | None
    is_published: bool

    questions: list[QuestionResponse] 

    class Config:
        from_attributes = True
        
class SurveyCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        """Prevent titles made only of whitespace."""
        value = value.strip()
        if not value:
            raise ValueError("Survey title cannot be empty")
        return value

class SurveyUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        """Apply the same title rule to updates as to creation."""
        value = value.strip()
        if not value:
            raise ValueError("Survey title cannot be empty")
        return value

class SurveyResponse(BaseModel):
    id: int
    title: str
    description: str | None
    created_by: int
    is_published: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


