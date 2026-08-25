import csv

from collections import Counter
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

    # Generate an ID for this individual response
    submission_id = str(uuid4())

    item = Response(
        survey_id=question.survey_id,
        user_id=current_user_id,
        submission_id=submission_id,
        question_id=question.id,
        answer=response.answer.strip(),
    )

    db.add(item)

    db.commit()

    db.refresh(item)

    return item


# ===========================================
# Get All Responses
# ===========================================

def get_all_responses(
    db: Session,
    survey_id: int | None = None
):

    query = db.query(Response)

    if survey_id is not None:

        return (
            query
            .filter(
                Response.survey_id == survey_id
            )
            .all()
        )

    return query.all()


# ===========================================
# Get Response By ID
# ===========================================

def get_response_by_id(
    db: Session,
    response_id: int
):

    return db.get(
        Response,
        response_id
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

    response.answer = response_data.answer.strip()

    db.commit()

    db.refresh(response)

    return response


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
        question.id: question
        for question in survey.questions
    }


    # ===========================================
    # Submitted Answers
    # ===========================================

    submitted = {
        answer.question_id: answer.answer.strip()
        for answer in submission.answers
    }


    # ===========================================
    # Validate Question IDs
    # ===========================================

    if (
        len(submitted) != len(submission.answers)
        or any(
            question_id not in questions
            for question_id in submitted
        )
    ):

        raise HTTPException(
            status_code=400,
            detail="One or more answers do not belong to this survey"
        )


    # ===========================================
    # Validate Required Questions
    # ===========================================

    missing = [
        question.question_text
        for question in questions.values()
        if (
            question.is_required
            and not submitted.get(question.id)
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
    # Validate Anonymous Submission
    # ===========================================

    # Use the persistent ID sent by the browser
    submission_id = str(
        submission.submission_id
    )

    # Block repeat submission for this survey
    existing_submission = (
        db.query(Response)
        .filter(
            Response.survey_id == survey_id,
            Response.submission_id == submission_id,
        )
        .first()
    )

    if existing_submission:

        raise HTTPException(
            status_code=409,
            detail="This survey has already been submitted."
        )


    # ===========================================
    # Save Responses
    # ===========================================

    for question_id, answer in submitted.items():

        if not answer:
            continue

        # Group answers under one submission ID
        response = Response(
            survey_id=survey_id,
            user_id=None,
            submission_id=submission_id,
            question_id=question_id,
            answer=answer,
        )

        db.add(response)


    # ===========================================
    # Commit Submission
    # ===========================================

    try:

        db.commit()

    except IntegrityError:

        db.rollback()

        # Handle simultaneous duplicate requests safely
        duplicate_submission = (
            db.query(Response)
            .filter(
                Response.survey_id == survey_id,
                Response.submission_id == submission_id,
            )
            .first()
        )

        if duplicate_submission:

            raise HTTPException(
                status_code=409,
                detail="This survey has already been submitted."
            )

        raise

    except Exception:

        db.rollback()

        raise


    # ===========================================
    # Response
    # ===========================================

    return {
        "message": "Survey submitted successfully",
        "submission_id": submission_id,
    }


# ===========================================
# Get Responses By Question
# ===========================================

def get_responses_by_question(
    db: Session,
    question_id: int
):

    return (
        db.query(Response)
        .filter(
            Response.question_id == question_id
        )
        .all()
    )


# ===========================================
# Get Responses By Survey
# ===========================================

def get_responses_by_survey(
    db: Session,
    survey_id: int
):

    return (
        db.query(Response)
        .filter(
            Response.survey_id == survey_id
        )
        .all()
    )


# ===========================================
# Question Analytics
# ===========================================

def get_question_analytics(
    db: Session,
    question: Question
):

    answers = [
        row.answer
        for row in (
            db.query(Response.answer)
            .filter(
                Response.question_id == question.id
            )
            .all()
        )
    ]

    question_type = (
        question.question_type.lower()
    )

    result = {
        "question_id": question.id,
        "question": question.question_text,
        "question_type": question_type,
        "total_responses": len(answers),
        "average_rating": None,
        "yes_count": None,
        "no_count": None,
        "answer_breakdown": None,
        "text_responses": None,
    }


    # ===========================================
    # Rating Analytics
    # ===========================================

    if question_type == "rating":

        ratings = [
            int(answer)
            for answer in answers
            if (
                answer.isdigit()
                and 1 <= int(answer) <= 5
            )
        ]

        result["average_rating"] = (
            round(
                sum(ratings) / len(ratings),
                2
            )
            if ratings
            else None
        )


    # ===========================================
    # Choice Analytics
    # ===========================================

    elif question_type in {
        "yes/no",
        "yes_no",
        "radio",
        "checkbox",
        "dropdown",
    }:

        values = [
            value.strip()
            for answer in answers
            for value in answer.split(",")
            if value.strip()
        ]

        counts = Counter(values)

        result["answer_breakdown"] = (
            dict(counts)
        )

        result["yes_count"] = sum(
            count
            for value, count in counts.items()
            if value.lower() == "yes"
        )

        result["no_count"] = sum(
            count
            for value, count in counts.items()
            if value.lower() == "no"
        )


    # ===========================================
    # Text Analytics
    # ===========================================

    else:

        result["text_responses"] = answers


    return result


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

    writer = csv.writer(output)


    # CSV header
    writer.writerow([
        "Question",
        "Question Type",
        "Answer",
    ])


    # CSV rows
    for question in survey.questions:

        for response in question.responses:

            writer.writerow([
                question.question_text,
                question.question_type,
                response.answer,
            ])


    output.seek(0)

    return output