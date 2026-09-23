from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from app.schemas.question import QuestionResponse

TITLE_MAX_WORDS = 20
DESCRIPTION_MAX_WORDS = 300


def count_words(value: str) -> int:
    return len(value.split())


class SurveyWithQuestions(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    is_published: bool


    questions: list[QuestionResponse] 
        
class SurveyCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        """Prevent titles made only of whitespace."""
        value = value.strip()
        if not value:
            raise ValueError("Survey title cannot be empty")
        if count_words(value) > TITLE_MAX_WORDS:
            raise ValueError(f"Survey title cannot exceed {TITLE_MAX_WORDS} words")
        return value

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        """Descriptions are required so survey cards and exports stay readable."""
        value = value.strip()
        if not value:
            raise ValueError("Survey description cannot be empty")
        if count_words(value) > DESCRIPTION_MAX_WORDS:
            raise ValueError(
                f"Survey description cannot exceed {DESCRIPTION_MAX_WORDS} words"
            )
        return value

class SurveyUpdate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=5000)

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        """Apply the same title rule to updates as to creation."""
        value = value.strip()
        if not value:
            raise ValueError("Survey title cannot be empty")
        if count_words(value) > TITLE_MAX_WORDS:
            raise ValueError(f"Survey title cannot exceed {TITLE_MAX_WORDS} words")
        return value

    @field_validator("description")
    @classmethod
    def strip_description(cls, value: str) -> str:
        """Apply the same description rule to updates as to creation."""
        value = value.strip()
        if not value:
            raise ValueError("Survey description cannot be empty")
        if count_words(value) > DESCRIPTION_MAX_WORDS:
            raise ValueError(
                f"Survey description cannot exceed {DESCRIPTION_MAX_WORDS} words"
            )
        return value

class SurveyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: str | None
    created_by: int
    is_published: bool
    created_at: datetime
    updated_at: datetime


