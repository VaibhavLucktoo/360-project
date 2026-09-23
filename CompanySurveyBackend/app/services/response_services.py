import csv

from io import StringIO
from uuid import uuid4

from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.response import Response
from app.models.survey import Survey

from app.schemas.response import (
    ResponseCreate,
    ResponseUpdate,
    SurveySubmission,
)


# ===========================================
# Choice Question Types
# ===========================================

CHOICE_TYPES = {
    "radio",
    "dropdown",
    # "checkbox" can be added back when multi-select questions return.
}


TEXT_TYPES = {
    "text",
    "textarea",
}


# ===========================================
# Resolve Stored Option IDs
# ===========================================

def resolve_answer_display(
    question: Question | None,
    answer: str
):

    # Return raw answer when the question is unavailable.
    if question is None:
        return answer


    question_type = (
        question.question_type
        .strip()
        .lower()
    )


    # Text and rating answers are already readable.
    if question_type not in CHOICE_TYPES:
        return answer


    # Map option IDs to visible labels.
    option_map = {
        str(option.id):
            option.option_text

        for option in question.options
    }


    # Supports one value now and multiple values later.
    answer_values = [
        value.strip()

        for value in answer.split(",")

        if value.strip()
    ]


    readable_values = [

        option_map.get(
            value,
            value
        )

        for value in answer_values
    ]


    return ", ".join(
        readable_values
    )


def validate_answer_for_question(
    question: Question,
    answer: str,
):
    """Validate the submitted answer against the saved question definition."""

    question_type = (
        question.question_type
        .strip()
        .lower()
    )

    if question_type in TEXT_TYPES:
        return

    if question_type == "rating":
        if answer not in {"1", "2", "3", "4", "5"}:
            raise HTTPException(
                status_code=400,
                detail=f"Rating answer for question {question.id} must be between 1 and 5.",
            )

        return

    if question_type in CHOICE_TYPES:
        valid_option_ids = {
            str(option.id)
            for option in question.options
        }

        if not valid_option_ids:
            raise HTTPException(
                status_code=400,
                detail=f"{question_type} question {question.id} does not have any options.",
            )

        if answer not in valid_option_ids:
            raise HTTPException(
                status_code=400,
                detail=f"Answer for question {question.id} must be one of the saved option IDs.",
            )

        return

    raise HTTPException(
        status_code=400,
        detail=f"Unsupported question type for question {question.id}.",
    )


# ===========================================
# Add Admin Display Fields
# ===========================================

def attach_response_display_fields(
    db: Session,
    response: Response
):

    survey = db.get(
        Survey,
        response.survey_id
    )


    question = db.get(
        Question,
        response.question_id
    )


    # These fields are not database columns.
    # They are only added for API responses.
    response.survey_title = (
        survey.title
        if survey
        else None
    )


    response.question_text = (
        question.question_text
        if question
        else None
    )


    response.question_type = (
        question.question_type
        if question
        else None
    )


    response.answer_display = (
        resolve_answer_display(
            question,
            response.answer
        )
    )


    return response


# ===========================================
# Create Individual Response
# ===========================================

def create_response(
    db: Session,
    response: ResponseCreate,
    current_user_id: int
):

    question = db.get(
        Question,
        response.question_id
    )


    if question is None:
        return None

    survey = db.get(Survey, question.survey_id)
    if survey is None or not survey.is_published:
        raise HTTPException(status_code=400, detail="Survey is not published")

    answer = (
        response.answer.strip()
    )

    validate_answer_for_question(
        question,
        answer,
    )

    # Generate an ID for this individual response.
    submission_id = str(
        uuid4()
    )


    item = Response(

        survey_id=
            question.survey_id,

        user_id=
            current_user_id,

        submission_id=
            submission_id,

        question_id=
            question.id,

        answer=
            answer,

    )


    db.add(item)

    db.commit()

    db.refresh(item)


    return attach_response_display_fields(
        db,
        item
    )


# ===========================================
# Get All Responses
# ===========================================

def get_all_responses(
    db: Session,
    survey_id: int | None = None
):

    query = db.query(
        Response
    )


    if survey_id is not None:

        responses = (
            query
            .filter(
                Response.survey_id ==
                survey_id
            )
            .all()
        )

    else:

        responses = (
            query.all()
        )


    # Add readable admin values.
    return [

        attach_response_display_fields(
            db,
            response
        )

        for response in responses
    ]


# ===========================================
# Get Response By ID
# ===========================================

def get_response_by_id(
    db: Session,
    response_id: int
):

    response = db.get(
        Response,
        response_id
    )


    if response is None:
        return None


    return attach_response_display_fields(
        db,
        response
    )


# ===========================================
# Update Response
# ===========================================

def update_response(
    db: Session,
    response_id: int,
    response_data: ResponseUpdate
):

    response = db.get(
        Response,
        response_id
    )


    if response is None:
        return None

    validate_answer_for_question(
        response.question,
        response_data.answer.strip(),
    )

    response.answer = (
        response_data.answer.strip()
    )


    db.commit()

    db.refresh(response)


    return attach_response_display_fields(
        db,
        response
    )


# ===========================================
# Delete Response
# ===========================================

def delete_response(
    db: Session,
    response_id: int
):

    response = db.get(
        Response,
        response_id
    )


    if response is None:
        return None


    db.delete(response)

    db.commit()


    return response


# ===========================================
# Submit Anonymous Survey
# ===========================================

def submit_survey(
    db: Session,
    survey_id: int,
    submission: SurveySubmission
):

    # ===========================================
    # Check Survey
    # ===========================================

    survey = db.get(
        Survey,
        survey_id
    )


    if survey is None:

        raise HTTPException(
            status_code=404,
            detail="Survey not found"
        )


    # ===========================================
    # Survey Must Be Published
    # ===========================================

    if not survey.is_published:

        raise HTTPException(
            status_code=400,
            detail="Survey is not published"
        )


    # ===========================================
    # Survey Questions
    # ===========================================

    questions = {

        question.id:
            question

        for question
        in survey.questions

    }


    # ===========================================
    # Submitted Answers
    # ===========================================

    submitted = {

        answer.question_id:
            answer.answer.strip()

        for answer
        in submission.answers

    }


    # ===========================================
    # Validate Question IDs
    # ===========================================

    if (

        len(submitted) !=
        len(submission.answers)

        or any(

            question_id
            not in questions

            for question_id
            in submitted

        )

    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "One or more answers "
                "do not belong to this survey"
            )
        )


    # ===========================================
    # Validate Required Questions
    # ===========================================

    missing = [

        question.question_text

        for question
        in questions.values()

        if (
            question.is_required
            and
            not submitted.get(
                question.id
            )
        )

    ]


    if missing:

        raise HTTPException(
            status_code=400,
            detail=(
                "Required questions are unanswered: "
                + ", ".join(missing)
            )
        )


    # ===========================================
    # Validate Answer Values
    # ===========================================

    for (
        question_id,
        answer
    ) in submitted.items():


        if not answer:
            continue


        validate_answer_for_question(
            questions[question_id],
            answer,
        )


    # ===========================================
    # Validate Anonymous Submission
    # ===========================================

    # Use the persistent browser submission ID.
    submission_id = str(
        submission.submission_id
    )


    existing_submission = (

        db.query(Response)

        .filter(

            Response.survey_id ==
                survey_id,

            Response.submission_id ==
                submission_id,

        )

        .first()

    )


    if existing_submission:

        raise HTTPException(
            status_code=409,
            detail=(
                "This survey has already "
                "been submitted."
            )
        )


    # ===========================================
    # Save Responses
    # ===========================================

    for (
        question_id,
        answer
    ) in submitted.items():


        if not answer:
            continue


        response = Response(

            survey_id=
                survey_id,

            user_id=
                None,

            submission_id=
                submission_id,

            question_id=
                question_id,

            answer=
                answer,

        )


        db.add(response)


    # ===========================================
    # Commit Submission
    # ===========================================

    try:

        db.commit()


    except IntegrityError:

        db.rollback()


        duplicate_submission = (

            db.query(Response)

            .filter(

                Response.survey_id ==
                    survey_id,

                Response.submission_id ==
                    submission_id,

            )

            .first()

        )


        if duplicate_submission:

            raise HTTPException(
                status_code=409,
                detail=(
                    "This survey has already "
                    "been submitted."
                )
            )


        raise


    except Exception:

        db.rollback()

        raise


    # ===========================================
    # Submission Response
    # ===========================================

    return {

        "message":
            "Survey submitted successfully",

        "submission_id":
            submission_id,

    }


# ===========================================
# Get Responses By Question
# ===========================================

def get_responses_by_question(
    db: Session,
    question_id: int
):

    responses = (

        db.query(Response)

        .filter(
            Response.question_id ==
            question_id
        )

        .all()

    )


    return [

        attach_response_display_fields(
            db,
            response
        )

        for response in responses

    ]


# ===========================================
# Get Responses By Survey
# ===========================================

def get_responses_by_survey(
    db: Session,
    survey_id: int
):

    responses = (

        db.query(Response)

        .filter(
            Response.survey_id ==
            survey_id
        )

        .all()

    )


    return [

        attach_response_display_fields(
            db,
            response
        )

        for response in responses

    ]


# ===========================================
# Export Survey Responses To CSV
# ===========================================

def export_survey_csv(
    db: Session,
    survey_id: int
):

    survey = db.get(
        Survey,
        survey_id
    )


    if survey is None:

        raise HTTPException(
            status_code=404,
            detail="Survey not found"
        )


    output = StringIO()

    writer = csv.writer(
        output
    )


    questions = sorted(
        survey.questions,
        key=lambda question: question.display_order,
    )


    questions_by_id = {
        question.id: question
        for question in questions
    }


    responses = (

        db.query(Response)

        .filter(
            Response.survey_id ==
            survey_id
        )

        .order_by(
            Response.created_at,
            Response.submission_id,
        )

        .all()

    )


    submission_rows = {}


    for response in responses:

        question = questions_by_id.get(
            response.question_id
        )


        if question is None:
            continue


        if response.submission_id not in submission_rows:

            submission_rows[
                response.submission_id
            ] = {
                "submitted_at":
                    response.created_at,

                "answers":
                    {},
            }


        if (
            response.created_at
            <
            submission_rows[
                response.submission_id
            ]["submitted_at"]
        ):

            submission_rows[
                response.submission_id
            ]["submitted_at"] = response.created_at


        submission_rows[
            response.submission_id
        ]["answers"][
            response.question_id
        ] = resolve_answer_display(
            question,
            response.answer
        )


    # CSV header
    writer.writerow(
        [
            "Submission ID",
            "Submitted At",
        ]
        + [
            question.question_text
            for question in questions
        ]
    )


    # CSV rows: one row per survey submission.
    ordered_submission_ids = sorted(
        submission_rows,
        key=lambda submission_id: (
            submission_rows[submission_id]["submitted_at"],
            submission_id,
        ),
    )


    for submission_id in ordered_submission_ids:

        submission_data = submission_rows[
            submission_id
        ]

        writer.writerow(
            [
                submission_id,
                submission_data["submitted_at"],
            ]
            + [
                submission_data["answers"].get(
                    question.id,
                    ""
                )
                for question in questions
            ]
        )


    output.seek(0)


    return output
