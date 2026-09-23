"""Tests for request validation and the baseline API health endpoint."""

import csv

from uuid import uuid4

import pytest
from fastapi import HTTPException
from pydantic import ValidationError

from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.response import Response
from app.models.survey import Survey
from app.models.user import User
from app.auth import auth as active_auth
from app.auth import oauth2 as legacy_oauth2
from app.dependencies.permissions import require_admin
from app.main import app
from app.schemas.question import QuestionCreate
from app.schemas.question_option import QuestionOptionCreate
from app.schemas.response import ResponseCreate, SurveyAnswer, SurveySubmission
from app.schemas.survey import SurveyCreate, SurveyUpdate
from app.schemas.user import PasswordUpdate, UserCreate, UserUpdate
from app.services.question_services import create_question, delete_question
from app.services.analytics_services import get_question_analytics
from app.services.response_services import export_survey_csv, submit_survey
from app.services.survey_services import delete_survey, publish_survey
from app.services.user_services import create_user, login_user, update_current_user_password


def test_home_endpoint_returns_service_message(client):
    """Verify the application can start with the isolated test database."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "Welcome to Company Survey Backend"}


def test_legacy_oauth2_module_uses_active_auth_dependency():
    """Legacy oauth2 imports should resolve to the active auth implementation."""
    assert legacy_oauth2.get_current_user is active_auth.get_current_user
    assert legacy_oauth2.oauth2_scheme is active_auth.oauth2_scheme


def test_get_missing_user_returns_404(client):
    """Missing users should return a clean 404 instead of response validation errors."""
    app.dependency_overrides[require_admin] = lambda: User(
        id=1,
        employee_id="E001",
        full_name="Admin User",
        email="admin@example.com",
        password_hash="hashed",
        role="admin",
        role_id=1,
        department="People",
    )

    response = client.get("/users/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "User not found"}


def test_question_schema_normalizes_valid_type():
    """Question types are normalized once at the API boundary."""
    question = QuestionCreate(survey_id=1, question_text="  Is this clear?  ", question_type="RATING", display_order=1)
    assert question.question_text == "Is this clear?"
    assert question.question_type == "rating"


@pytest.mark.parametrize("question_type", ["", "number", "yes/no", "checkbox"])
def test_question_schema_rejects_unsupported_type(question_type):
    """Unsupported types fail before they can be saved or rendered."""
    with pytest.raises(ValidationError):
        QuestionCreate(survey_id=1, question_text="Question", question_type=question_type, display_order=1)


def test_survey_schema_rejects_blank_title():
    """A survey must have a human-readable title."""
    with pytest.raises(ValidationError):
        SurveyCreate(title="   ")


def test_survey_schema_requires_presentable_description():
    """Survey descriptions are required and trimmed for display/export quality."""
    survey = SurveyCreate(
        title="Engagement",
        description="  Quarterly pulse survey  ",
    )

    assert survey.description == "Quarterly pulse survey"

    with pytest.raises(ValidationError):
        SurveyCreate(title="Engagement", description="   ")

    with pytest.raises(ValidationError):
        SurveyUpdate(title="Engagement", description="   ")


@pytest.mark.parametrize(
    "schema_cls,field,data",
    [
        (
            SurveyCreate,
            "title",
            {
                "title": " ".join(["word"] * 21),
                "description": "Valid description",
            },
        ),
        (
            SurveyCreate,
            "description",
            {
                "title": "Engagement",
                "description": " ".join(["word"] * 301),
            },
        ),
        (
            QuestionCreate,
            "question_text",
            {
                "survey_id": 1,
                "question_text": " ".join(["word"] * 61),
                "question_type": "text",
                "display_order": 1,
            },
        ),
        (
            QuestionOptionCreate,
            "option_text",
            {
                "option_text": " ".join(["word"] * 21),
                "display_order": 1,
            },
        ),
        (
            ResponseCreate,
            "answer",
            {
                "question_id": 1,
                "answer": " ".join(["word"] * 301),
            },
        ),
    ],
)
def test_text_fields_reject_excessive_word_counts(schema_cls, field, data):
    """Human-facing text fields keep practical word limits."""
    with pytest.raises(ValidationError) as error:
        schema_cls(**data)

    assert field in str(error.value)


def test_user_create_schema_trims_text_and_accepts_role_id():
    """User input is normalized before it reaches the service layer."""
    user = UserCreate(
        employee_id=" E001 ",
        full_name=" Admin User ",
        email="admin@example.com",
        password=" secure-password ",
        role_id=1,
        department=" People ",
    )

    assert user.employee_id == "E001"
    assert user.full_name == "Admin User"
    assert user.password == "secure-password"
    assert user.role_id == 1
    assert user.department == "People"


@pytest.mark.parametrize(
    "field,value",
    [
        ("employee_id", "   "),
        ("full_name", "   "),
        ("password", "   "),
        ("department", "   "),
    ],
)
def test_user_create_schema_rejects_blank_required_text(field, value):
    """Required user fields cannot be whitespace-only strings."""
    data = {
        "employee_id": "E001",
        "full_name": "Admin User",
        "email": "admin@example.com",
        "password": "secure123",
        "role_id": 1,
        "department": "People",
    }
    data[field] = value

    with pytest.raises(ValidationError):
        UserCreate(**data)


@pytest.mark.parametrize("role", [0, -1, "boss", True])
def test_user_schema_rejects_invalid_role_ids(role):
    """Role IDs must be positive integers."""
    with pytest.raises(ValidationError):
        UserCreate(
            employee_id="E001",
            full_name="Admin User",
            email="admin@example.com",
            password="secure123",
            role_id=role,
            department="People",
        )


def test_user_create_schema_rejects_short_password():
    """New users must have a minimally useful password length."""
    with pytest.raises(ValidationError):
        UserCreate(
            employee_id="E001",
            full_name="Admin User",
            email="admin@example.com",
            password="short",
            role_id=1,
            department="People",
        )


def test_user_create_schema_rejects_password_with_spaces():
    """Passwords cannot contain whitespace because login strips/rejects it."""
    with pytest.raises(ValidationError):
        UserCreate(
            employee_id="E001",
            full_name="Admin User",
            email="admin@example.com",
            password="secure 123",
            role_id=1,
            department="People",
        )


def test_password_update_schema_rejects_blank_or_spaced_passwords():
    """Password updates must use non-empty values without whitespace."""
    with pytest.raises(ValidationError):
        PasswordUpdate(
            current_password="   ",
            new_password="secure123",
        )

    with pytest.raises(ValidationError):
        PasswordUpdate(
            current_password="secure123",
            new_password="secure 456",
        )


def test_update_current_user_password_validates_current_password(db_session):
    """A password cannot be changed unless the current password is correct."""
    user_data = UserCreate(
        employee_id="E001",
        full_name="Admin User",
        email="admin@example.com",
        password="secure123",
        role_id=1,
        department="People",
    )
    user = create_user(db_session, user_data)

    with pytest.raises(HTTPException) as error:
        update_current_user_password(
            db_session,
            user.id,
            PasswordUpdate(
                current_password="wrong123",
                new_password="secure456",
            ),
        )

    assert error.value.status_code == 400
    assert error.value.detail == "Current password is incorrect."


def test_update_current_user_password_rejects_same_password(db_session):
    """The password change endpoint should not accept a no-op update."""
    user_data = UserCreate(
        employee_id="E001",
        full_name="Admin User",
        email="admin@example.com",
        password="secure123",
        role_id=1,
        department="People",
    )
    user = create_user(db_session, user_data)

    with pytest.raises(HTTPException) as error:
        update_current_user_password(
            db_session,
            user.id,
            PasswordUpdate(
                current_password="secure123",
                new_password="secure123",
            ),
        )

    assert error.value.status_code == 400
    assert error.value.detail == "New password must be different from the current password."


def test_update_current_user_password_changes_login_secret(db_session):
    """After a password update, old credentials fail and new credentials work."""
    user_data = UserCreate(
        employee_id="E001",
        full_name="Admin User",
        email="admin@example.com",
        password="secure123",
        role_id=1,
        department="People",
    )
    user = create_user(db_session, user_data)

    update_current_user_password(
        db_session,
        user.id,
        PasswordUpdate(
            current_password="secure123",
            new_password="secure456",
        ),
    )

    class OldLoginForm:
        username = "admin@example.com"
        password = "secure123"

    class NewLoginForm:
        username = "admin@example.com"
        password = "secure456"

    assert login_user(db_session, OldLoginForm()) is None
    assert login_user(db_session, NewLoginForm())["token_type"] == "bearer"


def test_user_update_schema_accepts_role_assignment():
    """User updates reference a role by ID."""
    user = UserUpdate(
        full_name=" Manager User ",
        email="manager@example.com",
        role_id=1,
        department=" Operations ",
    )

    assert user.full_name == "Manager User"
    assert user.role_id == 1
    assert user.department == "Operations"


def test_create_user_rejects_duplicate_employee_id_or_email(db_session):
    """User uniqueness errors are returned as clean API errors."""
    user = UserCreate(
        employee_id="E001",
        full_name="Admin User",
        email="admin@example.com",
        password="secure123",
        role_id=1,
        department="People",
    )
    create_user(db_session, user)

    duplicate_user = UserCreate(
        employee_id="E001",
        full_name="Other User",
        email="other@example.com",
        password="secure123",
        role_id=1,
        department="People",
    )

    with pytest.raises(HTTPException) as error:
        create_user(db_session, duplicate_user)

    assert error.value.status_code == 400
    assert error.value.detail == "Employee ID or email already exists."


def test_login_rejects_whitespace_credentials(db_session):
    """Login should not treat spaces as usable email/password input."""
    user = UserCreate(
        employee_id="E001",
        full_name="Admin User",
        email="admin@example.com",
        password="secure123",
        role_id=1,
        department="People",
    )
    create_user(db_session, user)

    class LoginForm:
        username = "admin@example.com"
        password = "secure 123"

    assert login_user(db_session, LoginForm()) is None


def test_create_question_rejects_duplicate_display_order(db_session):
    """Question order collisions return a controlled validation error."""
    survey = create_published_survey(db_session)
    db_session.commit()

    first_question = QuestionCreate(
        survey_id=survey.id,
        question_text="First question",
        question_type="text",
        display_order=1,
    )
    create_question(db_session, first_question)

    duplicate_question = QuestionCreate(
        survey_id=survey.id,
        question_text="Second question",
        question_type="textarea",
        display_order=1,
    )

    with pytest.raises(HTTPException) as error:
        create_question(db_session, duplicate_question)

    assert error.value.status_code == 400
    assert error.value.detail == "Question display order already exists for this survey."


def create_published_survey(db_session):
    """Create the smallest published survey graph needed for response tests."""
    user = User(
        employee_id="E001",
        full_name="Admin User",
        email="admin@example.com",
        password_hash="hashed",
        role="admin",
        role_id=1,
        department="People",
    )
    db_session.add(user)
    db_session.flush()

    survey = Survey(
        title="Engagement",
        description="Quarterly check",
        created_by=user.id,
        is_published=True,
    )
    db_session.add(survey)
    db_session.flush()

    return survey


def create_draft_survey(db_session):
    """Create a draft survey for publish-validation tests."""
    user = User(
        employee_id="E001",
        full_name="Admin User",
        email="admin@example.com",
        password_hash="hashed",
        role="admin",
        role_id=1,
        department="People",
    )
    db_session.add(user)
    db_session.flush()

    survey = Survey(
        title="Engagement",
        description="Quarterly check",
        created_by=user.id,
        is_published=False,
    )
    db_session.add(survey)
    db_session.flush()

    return survey


def add_question(
    db_session,
    survey,
    question_type,
    display_order,
    is_required=True,
):
    question = Question(
        survey_id=survey.id,
        question_text=f"{question_type} question",
        question_type=question_type,
        display_order=display_order,
        is_required=is_required,
    )
    db_session.add(question)
    db_session.flush()
    return question


def add_option(db_session, question, label, display_order):
    option = QuestionOption(
        question_id=question.id,
        option_text=label,
        display_order=display_order,
    )
    db_session.add(option)
    db_session.flush()
    return option


def make_submission(*answers):
    return SurveySubmission(
        submission_id=uuid4(),
        answers=[
            SurveyAnswer(question_id=question_id, answer=answer)
            for question_id, answer in answers
        ],
    )


def test_publish_survey_rejects_empty_survey(db_session):
    """A survey cannot become public until it has at least one question."""
    survey = create_draft_survey(db_session)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        publish_survey(db_session, survey.id)

    assert error.value.status_code == 400
    assert "at least one question" in error.value.detail
    assert survey.is_published is False


def test_publish_survey_rejects_unsupported_checkbox_questions(db_session):
    """Old checkbox questions must not become public while checkbox is disabled."""
    survey = create_draft_survey(db_session)
    add_question(db_session, survey, "checkbox", 1)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        publish_survey(db_session, survey.id)

    assert error.value.status_code == 400
    assert "Unsupported question type" in error.value.detail
    assert survey.is_published is False


def test_publish_survey_rejects_choice_question_with_too_few_options(db_session):
    """Radio/dropdown questions need at least two choices before publishing."""
    survey = create_draft_survey(db_session)
    question = add_question(db_session, survey, "radio", 1)
    add_option(db_session, question, "Remote", 1)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        publish_survey(db_session, survey.id)

    assert error.value.status_code == 400
    assert "at least two options" in error.value.detail
    assert survey.is_published is False


def test_publish_survey_rejects_duplicate_option_labels(db_session):
    """Publish validation catches duplicate option text even without a DB constraint."""
    survey = create_draft_survey(db_session)
    question = add_question(db_session, survey, "dropdown", 1)
    add_option(db_session, question, "Remote", 1)
    add_option(db_session, question, " remote ", 2)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        publish_survey(db_session, survey.id)

    assert error.value.status_code == 400
    assert "Duplicate options" in error.value.detail
    assert survey.is_published is False


def test_publish_survey_accepts_valid_survey(db_session):
    """A structurally complete draft survey can be published."""
    survey = create_draft_survey(db_session)
    rating_question = add_question(db_session, survey, "rating", 1)
    dropdown_question = add_question(db_session, survey, "dropdown", 2)
    add_option(db_session, dropdown_question, "Remote", 1)
    add_option(db_session, dropdown_question, "Office", 2)
    db_session.commit()

    result = publish_survey(db_session, survey.id)

    assert result.id == survey.id
    assert result.is_published is True
    assert rating_question.question_type == "rating"


@pytest.mark.parametrize("answer", ["0", "6", "bad", "1.5", ""])
def test_submit_survey_rejects_invalid_rating_answers(db_session, answer):
    """Ratings must be submitted as whole numbers from 1 to 5."""
    survey = create_published_survey(db_session)
    question = add_question(db_session, survey, "rating", 1)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        submit_survey(
            db_session,
            survey.id,
            make_submission((question.id, answer)),
        )

    assert error.value.status_code == 400


@pytest.mark.parametrize("answer", ["1", "5"])
def test_submit_survey_accepts_rating_edges(db_session, answer):
    """The lowest and highest valid ratings are accepted."""
    survey = create_published_survey(db_session)
    question = add_question(db_session, survey, "rating", 1)
    db_session.commit()

    result = submit_survey(
        db_session,
        survey.id,
        make_submission((question.id, answer)),
    )

    assert result["message"] == "Survey submitted successfully"


def test_submit_survey_rejects_invalid_radio_option_id(db_session):
    """Choice answers must reference an option saved for that question."""
    survey = create_published_survey(db_session)
    question = add_question(db_session, survey, "radio", 1)
    add_option(db_session, question, "Remote", 1)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        submit_survey(
            db_session,
            survey.id,
            make_submission((question.id, "999")),
        )

    assert error.value.status_code == 400
    assert "saved option IDs" in error.value.detail


def test_submit_survey_accepts_valid_dropdown_option_id(db_session):
    """Dropdown answers are stored as valid option IDs."""
    survey = create_published_survey(db_session)
    question = add_question(db_session, survey, "dropdown", 1)
    option = add_option(db_session, question, "Office", 1)
    db_session.commit()

    result = submit_survey(
        db_session,
        survey.id,
        make_submission((question.id, str(option.id))),
    )

    assert result["message"] == "Survey submitted successfully"


def test_submit_survey_rejects_choice_question_without_options(db_session):
    """Choice questions cannot accept answers when no options exist."""
    survey = create_published_survey(db_session)
    question = add_question(db_session, survey, "radio", 1)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        submit_survey(
            db_session,
            survey.id,
            make_submission((question.id, "1")),
        )

    assert error.value.status_code == 400
    assert "does not have any options" in error.value.detail


def test_submit_survey_allows_blank_optional_answer(db_session):
    """Blank optional answers are skipped instead of stored."""
    survey = create_published_survey(db_session)
    question = add_question(db_session, survey, "textarea", 1, is_required=False)
    db_session.commit()

    result = submit_survey(
        db_session,
        survey.id,
        make_submission((question.id, "   ")),
    )

    assert result["message"] == "Survey submitted successfully"


def test_submit_survey_rejects_duplicate_answered_question_ids(db_session):
    """A submission cannot answer the same question twice."""
    survey = create_published_survey(db_session)
    question = add_question(db_session, survey, "text", 1)
    db_session.commit()

    with pytest.raises(HTTPException) as error:
        submit_survey(
            db_session,
            survey.id,
            make_submission(
                (question.id, "First"),
                (question.id, "Second"),
            ),
        )

    assert error.value.status_code == 400


def test_export_survey_csv_groups_answers_by_submission(db_session):
    """CSV export should be one readable row per survey submission."""
    survey = create_published_survey(db_session)
    rating_question = add_question(db_session, survey, "rating", 1)
    dropdown_question = add_question(db_session, survey, "dropdown", 2)
    feedback_question = add_question(
        db_session,
        survey,
        "textarea",
        3,
        is_required=False,
    )
    option = add_option(db_session, dropdown_question, "Remote", 1)
    db_session.commit()

    first_submission = make_submission(
        (rating_question.id, "5"),
        (dropdown_question.id, str(option.id)),
        (feedback_question.id, "Good culture"),
    )
    second_submission = make_submission(
        (rating_question.id, "4"),
        (dropdown_question.id, str(option.id)),
        (feedback_question.id, "   "),
    )

    submit_survey(db_session, survey.id, first_submission)
    submit_survey(db_session, survey.id, second_submission)

    output = export_survey_csv(db_session, survey.id)
    rows = list(csv.reader(output))

    assert rows[0] == [
        "Submission ID",
        "Submitted At",
        "rating question",
        "dropdown question",
        "textarea question",
    ]
    assert rows[1][0] == str(first_submission.submission_id)
    assert rows[1][2:] == ["5", "Remote", "Good culture"]
    assert rows[2][0] == str(second_submission.submission_id)
    assert rows[2][2:] == ["4", "Remote", ""]


def test_get_question_analytics_returns_single_question_summary(db_session):
    """Question analytics should reuse survey analytics without requiring a new data shape."""
    survey = create_published_survey(db_session)
    rating_question = add_question(db_session, survey, "rating", 1)
    text_question = add_question(db_session, survey, "textarea", 2)
    db_session.commit()

    submit_survey(
        db_session,
        survey.id,
        make_submission(
            (rating_question.id, "5"),
            (text_question.id, "Strong teamwork"),
        ),
    )

    analytics = get_question_analytics(db_session, rating_question.id)

    assert analytics["question_id"] == rating_question.id
    assert analytics["total_responses"] == 1
    assert analytics["average_rating"] == 5


def test_delete_question_removes_options_and_responses(db_session):
    """Question deletion should cascade through its options and answers."""
    survey = create_published_survey(db_session)
    question = add_question(db_session, survey, "dropdown", 1)
    option = add_option(db_session, question, "Remote", 1)
    db_session.commit()

    submit_survey(
        db_session,
        survey.id,
        make_submission((question.id, str(option.id))),
    )

    deleted_question = delete_question(db_session, question.id)

    assert deleted_question is not None
    assert db_session.query(Question).count() == 0
    assert db_session.query(QuestionOption).count() == 0
    assert db_session.query(Response).count() == 0


def test_delete_survey_removes_questions_options_and_responses(db_session):
    """Survey deletion should remove its full child graph."""
    survey = create_published_survey(db_session)
    rating_question = add_question(db_session, survey, "rating", 1)
    dropdown_question = add_question(db_session, survey, "dropdown", 2)
    option = add_option(db_session, dropdown_question, "Remote", 1)
    db_session.commit()

    submit_survey(
        db_session,
        survey.id,
        make_submission(
            (rating_question.id, "5"),
            (dropdown_question.id, str(option.id)),
        ),
    )

    deleted_survey = delete_survey(db_session, survey.id)

    assert deleted_survey is not None
    assert db_session.query(Survey).count() == 0
    assert db_session.query(Question).count() == 0
    assert db_session.query(QuestionOption).count() == 0
    assert db_session.query(Response).count() == 0
