"""Tests for request validation and the baseline API health endpoint."""

import pytest
from pydantic import ValidationError

from app.schemas.question import QuestionCreate
from app.schemas.survey import SurveyCreate


def test_home_endpoint_returns_service_message(client):
    """Verify the application can start with the isolated test database."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Company Survey Backend"}


def test_question_schema_normalizes_valid_type():
    """Question types are normalized once at the API boundary."""
    question = QuestionCreate(survey_id=1, question_text="  Is this clear?  ", question_type="RATING", display_order=1)
    assert question.question_text == "Is this clear?"
    assert question.question_type == "rating"


@pytest.mark.parametrize("question_type", ["", "number", "yes/no"])
def test_question_schema_rejects_unsupported_type(question_type):
    """Unsupported types fail before they can be saved or rendered."""
    with pytest.raises(ValidationError):
        QuestionCreate(survey_id=1, question_text="Question", question_type=question_type, display_order=1)


def test_survey_schema_rejects_blank_title():
    """A survey must have a human-readable title."""
    with pytest.raises(ValidationError):
        SurveyCreate(title="   ")
