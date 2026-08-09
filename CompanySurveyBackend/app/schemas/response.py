from pydantic import BaseModel
from datetime import datetime


class ResponseCreate(BaseModel):
    question_id: int
    answer: str


class ResponseUpdate(BaseModel):
    answer: str


class ResponseResponse(BaseModel):
    id: int
    survey_id: int
    user_id: int
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


class SurveyAnalytics(BaseModel):
    """Anonymous, survey-level reporting returned only to administrators."""

    survey_id: int
    survey_title: str
    total_responses: int
    average_rating: float | None = None
    questions: list[QuestionAnalytics]
    is_published: bool