from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from app.schemas.question_option import (
    QuestionOptionCreate,
    QuestionOptionUpdate,
    QuestionOptionResponse,
)

QUESTION_TEXT_MAX_WORDS = 60


def count_words(value: str) -> int:
    return len(value.split())


class QuestionCreate(BaseModel):
    survey_id: int
    question_text: str = Field(min_length=1, max_length=2000)
    question_type: str
    display_order: int = Field(ge=1)
    is_required: bool = True

    # Only choice-based questions will use this list.
    options: list[QuestionOptionCreate] = []

    @field_validator("question_text")
    @classmethod
    def strip_question_text(cls, value: str) -> str:
        """Reject whitespace-only question text before it reaches the service layer."""
        value = value.strip()
        if not value:
            raise ValueError("Question text cannot be empty")
        if count_words(value) > QUESTION_TEXT_MAX_WORDS:
            raise ValueError(
                f"Question text cannot exceed {QUESTION_TEXT_MAX_WORDS} words"
            )
        return value

    @field_validator("question_type")
    @classmethod
    def validate_question_type(cls, value: str) -> str:
        """Keep question types consistent for rendering and later option validation."""
        normalized_value = value.strip().lower()
        # "checkbox" is kept out for now; add it back here when multi-select returns.
        allowed_types = {"text", "textarea", "radio", "rating", "dropdown"}
        if normalized_value not in allowed_types:
            raise ValueError("Unsupported question type")
        return normalized_value

class QuestionUpdate(BaseModel):
    question_text: str = Field(min_length=1, max_length=2000)
    question_type: str
    display_order: int = Field(ge=1)
    is_required: bool = True

    # Updated option list for radio/dropdown questions.
    # Checkbox support can reuse this when multi-select returns.
    options: list[QuestionOptionUpdate] = []

    @field_validator("question_text")
    @classmethod
    def strip_question_text(cls, value: str) -> str:
        """Reject whitespace-only question text before it reaches the service layer."""
        value = value.strip()
        if not value:
            raise ValueError("Question text cannot be empty")
        if count_words(value) > QUESTION_TEXT_MAX_WORDS:
            raise ValueError(
                f"Question text cannot exceed {QUESTION_TEXT_MAX_WORDS} words"
            )
        return value

    @field_validator("question_type")
    @classmethod
    def validate_question_type(cls, value: str) -> str:
        """Keep question types consistent for rendering and later option validation."""
        normalized_value = value.strip().lower()
        # "checkbox" is kept out for now; add it back here when multi-select returns.
        allowed_types = {"text", "textarea", "radio", "rating", "dropdown"}
        if normalized_value not in allowed_types:
            raise ValueError("Unsupported question type")
        return normalized_value

class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    survey_id: int
    question_text: str
    question_type: str
    display_order: int
    is_required: bool

    # Return saved options with the question.
    options: list[QuestionOptionResponse] = []

    created_at: datetime
    updated_at: datetime


CreateQuestion = QuestionCreate
UpdateQuestion = QuestionUpdate
