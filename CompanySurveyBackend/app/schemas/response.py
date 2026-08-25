from pydantic import BaseModel
from datetime import datetime
from uuid import UUID
from typing import List, Optional, Dict


class ResponseCreate(BaseModel):
    question_id: int
    answer: str


class ResponseUpdate(BaseModel):
    answer: str


class ResponseResponse(BaseModel):
    id: int
    survey_id: int
    # Anonymous responses may not have a user account
    user_id: int | None = None
    # Groups all answers from one survey submission
    submission_id: str
    
    question_id: int
    answer: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ----------------------------
# Survey Submission Schemas
# ----------------------------

class SurveyAnswer(BaseModel):
    question_id: int
    answer: str


class SurveySubmission(BaseModel):
    # Identifies one anonymous browser submission
    submission_id: UUID

    answers: list[SurveyAnswer]


# ----------------------------
# Response View Schema
# ----------------------------

class ResponseView(BaseModel):
    id: int
    question_id: int
    answer: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------------------
# Analytics Schemas
# ----------------------------

class QuestionAnalytics(BaseModel):
    question: str
    question_type: str
    total_responses: int

    # Rating Questions
    average_rating: float | None = None

    # Text Questions
    text_responses: list[str] | None = None
    #rating distribution:
    rating_distribution: Optional[Dict[int, int]] = None


class SurveyAnalytics(BaseModel):
    """Anonymous, survey-level reporting returned only to administrators."""

    survey_id: int
    survey_title: str
    total_responses: int
    average_rating: float | None = None
    questions: list[QuestionAnalytics]
    is_published: bool