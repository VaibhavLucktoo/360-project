from pydantic import BaseModel, Field, field_validator
from datetime import datetime

class QuestionCreate(BaseModel):
    survey_id: int
    question_text: str = Field(min_length=1, max_length=2000)
    question_type: str
    display_order: int = Field(ge=1)
    is_required: bool = True

    @field_validator("question_text")
    @classmethod
    def strip_question_text(cls, value: str) -> str:
        """Reject whitespace-only question text before it reaches the service layer."""
        value = value.strip()
        if not value:
            raise ValueError("Question text cannot be empty")
        return value

    @field_validator("question_type")
    @classmethod
    def validate_question_type(cls, value: str) -> str:
        """Keep question types consistent for rendering and later option validation."""
        normalized_value = value.strip().lower()
        allowed_types = {"text", "textarea", "radio", "checkbox", "rating", "dropdown"}
        if normalized_value not in allowed_types:
            raise ValueError("Unsupported question type")
        return normalized_value

class QuestionUpdate(BaseModel):
    question_text: str = Field(min_length=1, max_length=2000)
    question_type: str
    display_order: int = Field(ge=1)
    is_required: bool = True

    @field_validator("question_text")
    @classmethod
    def strip_question_text(cls, value: str) -> str:
        """Reject whitespace-only question text before it reaches the service layer."""
        value = value.strip()
        if not value:
            raise ValueError("Question text cannot be empty")
        return value

    @field_validator("question_type")
    @classmethod
    def validate_question_type(cls, value: str) -> str:
        """Keep question types consistent for rendering and later option validation."""
        normalized_value = value.strip().lower()
        allowed_types = {"text", "textarea", "radio", "checkbox", "rating", "dropdown"}
        if normalized_value not in allowed_types:
            raise ValueError("Unsupported question type")
        return normalized_value

class QuestionResponse(BaseModel):
    id: int
    survey_id: int
    question_text: str
    question_type: str
    display_order: int
    is_required: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


CreateQuestion = QuestionCreate
UpdateQuestion = QuestionUpdate
