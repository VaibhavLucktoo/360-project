from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.question_option import QuestionOption
from app.models.survey import Survey
from app.schemas.question import QuestionCreate, QuestionUpdate


# Question types that can contain custom options.
# Add "checkbox" back here when multi-select questions return.
CHOICE_TYPES = {"radio", "dropdown"}


def _validate_options(options):
    """Prevent duplicate option positions and labels."""

    display_orders = [option.display_order for option in options]

    if len(display_orders) != len(set(display_orders)):
        raise HTTPException(
            status_code=400,
            detail="Option display orders must be unique.",
        )

    option_labels = [
        option.option_text.strip().lower()
        for option in options
    ]

    if len(option_labels) != len(set(option_labels)):
        raise HTTPException(
            status_code=400,
            detail="Duplicate options are not allowed.",
        )


def create_question(db: Session, question: QuestionCreate):
    # Make sure the parent survey exists.
    survey = (
        db.query(Survey)
        .filter(Survey.id == question.survey_id)
        .first()
    )

    if survey is None:
        return None

    # Only choice-based questions may contain options.
    if question.question_type not in CHOICE_TYPES and question.options:
        raise HTTPException(
            status_code=400,
            detail=f"{question.question_type} questions cannot have options.",
        )

    _validate_options(question.options)

    db_question = Question(
        survey_id=question.survey_id,
        question_text=question.question_text,
        question_type=question.question_type,
        display_order=question.display_order,
        is_required=question.is_required,
    )

    # Attach options to the question.
    for option in question.options:
        db_question.options.append(
            QuestionOption(
                option_text=option.option_text,
                display_order=option.display_order,
            )
        )

    # The relationship cascade saves the options too.
    db.add(db_question)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Question display order already exists for this survey.",
        )

    db.refresh(db_question)

    return db_question


def get_all_questions(db: Session):
    return (
        db.query(Question)
        .order_by(
            Question.survey_id,
            Question.display_order,
        )
        .all()
    )


def get_question_by_id(db: Session, question_id: int):
    return (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )


def update_question(
    db: Session,
    question_id: int,
    question_data: QuestionUpdate,
):
    question = (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )

    if question is None:
        return None

    question.question_text = question_data.question_text
    question.question_type = question_data.question_type
    question.display_order = question_data.display_order
    question.is_required = question_data.is_required

    # Non-choice questions should not retain old options.
    if question_data.question_type not in CHOICE_TYPES:
        question.options.clear()

    # Only modify options when the API request actually included them.
    elif "options" in question_data.model_fields_set:
        _validate_options(question_data.options)

        existing_options = {
            option.id: option
            for option in question.options
        }

        incoming_ids = set()

        # Temporarily move current positions to avoid unique-order conflicts.
        for index, option in enumerate(question.options, start=1):
            option.display_order = -index

        db.flush()

        for option_data in question_data.options:
            if option_data.id is not None:
                # Existing option must belong to this question.
                existing_option = existing_options.get(option_data.id)

                if existing_option is None:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Option {option_data.id} does not belong to this question.",
                    )

                if option_data.id in incoming_ids:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Option {option_data.id} was submitted more than once.",
                    )

                incoming_ids.add(option_data.id)

                # Preserve the ID while changing its label/order.
                existing_option.option_text = option_data.option_text
                existing_option.display_order = option_data.display_order

            else:
                # No ID means this is a brand-new option.
                question.options.append(
                    QuestionOption(
                        option_text=option_data.option_text,
                        display_order=option_data.display_order,
                    )
                )

        # Remove options omitted from the updated list.
        for option_id, existing_option in existing_options.items():
            if option_id not in incoming_ids:
                question.options.remove(existing_option)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Question display order already exists for this survey.",
        )

    db.refresh(question)

    return question


def delete_question(db: Session, question_id: int):
    question = (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )

    if question is None:
        return None

    db.delete(question)
    db.commit()

    return question
