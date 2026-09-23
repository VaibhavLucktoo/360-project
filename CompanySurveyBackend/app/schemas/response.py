from pydantic import BaseModel, ConfigDict, Field, field_validator
from datetime import datetime
from uuid import UUID
from typing import List, Optional, Dict

ANSWER_MAX_WORDS = 300


def count_words(value: str) -> int:
    return len(value.split())


def clean_answer(value: str) -> str:
    value = value.strip()
    if count_words(value) > ANSWER_MAX_WORDS:
        raise ValueError(f"Answer cannot exceed {ANSWER_MAX_WORDS} words")
    return value


class ResponseCreate(BaseModel):
    question_id: int
    answer: str = Field(max_length=2000)

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, value: str) -> str:
        return clean_answer(value)


class ResponseUpdate(BaseModel):
    answer: str = Field(max_length=2000)

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, value: str) -> str:
        return clean_answer(value)


class ResponseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    survey_id: int

    # Anonymous responses may not have a user account.
    user_id: int | None = None

    # Groups answers belonging to one submission.
    submission_id: str

    question_id: int

    # Raw value stored in the database.
    answer: str

    # Human-readable values for the admin UI.
    survey_title: str | None = None
    question_text: str | None = None
    question_type: str | None = None
    answer_display: str | None = None

    created_at: datetime
    updated_at: datetime

# ----------------------------
# Survey Submission Schemas
# ----------------------------

class SurveyAnswer(BaseModel):
    question_id: int
    answer: str = Field(max_length=2000)

    @field_validator("answer")
    @classmethod
    def validate_answer(cls, value: str) -> str:
        return clean_answer(value)


class SurveySubmission(BaseModel):
    # Identifies one anonymous browser submission
    submission_id: UUID

    # List of answers for this submission.
    answers: list[SurveyAnswer]


# ----------------------------
# Response View Schema
# ----------------------------

class ResponseView(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    survey_id: int | None = None
    submission_id: str | None = None

    question_id: int

    # Raw database value.
    answer: str

    # Human-readable values for admin pages.
    survey_title: str | None = None
    question_text: str | None = None
    question_type: str | None = None
    answer_display: str | None = None

    created_at: datetime

# ----------------------------
# Analytics Schemas
# ----------------------------

class QuestionAnalytics(BaseModel):

    # Question information
    question_id: int | None = None
    question: str
    question_type: str
    total_responses: int


    # Rating analytics
    average_rating: float | None = None

    rating_distribution: Optional[
        Dict[int, int]
    ] = None


    # Choice analytics
    # Example:
    # {"Remote": 5, "Office": 2}
    answer_breakdown: Optional[
        Dict[str, int]
    ] = None


    # Useful for Yes/No questions
    yes_count: int | None = None
    no_count: int | None = None


    # Text / Textarea analytics
    text_responses: list[str] | None = None


class SurveyAnalytics(BaseModel):
    """Anonymous, survey-level reporting returned only to administrators."""

    survey_id: int
    survey_title: str
    total_responses: int
    average_rating: float | None = None
    questions: list[QuestionAnalytics]
    is_published: bool 
