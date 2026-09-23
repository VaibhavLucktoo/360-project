from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.survey import Survey
from app.schemas.survey import SurveyCreate, SurveyUpdate

CHOICE_TYPES = {"radio", "dropdown"}
SUPPORTED_QUESTION_TYPES = {"text", "textarea", "radio", "rating", "dropdown"}


def create_survey(db: Session, survey: SurveyCreate, current_user_id: int):
    db_survey = Survey(
        title= survey.title,
        description = survey.description,
        created_by = current_user_id
    )

    db.add(db_survey)
    db.commit()
    db.refresh(db_survey)

    return db_survey

def get_all_surveys(db: Session):
    return db.query(Survey).all()

def get_survey_by_id(db: Session, survey_id: int):
    return db.query(Survey).filter(Survey.id == survey_id).first()


def update_survey(db:Session,survey_id: int, survey_data: SurveyUpdate):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if survey is None:
        return None
    
    survey.title = survey_data.title
    survey.description = survey_data.description

    db.commit()
    db.refresh(survey)
    return survey

def delete_survey(db:Session, survey_id: int):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if survey is None:
        return None

    db.delete(survey)
    db.commit()
    return survey


def validate_survey_for_publish(survey: Survey):
    """Block structurally incomplete surveys from becoming public."""

    if not survey.title or not survey.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Survey title is required before publishing.",
        )

    if not survey.description or not survey.description.strip():
        raise HTTPException(
            status_code=400,
            detail="Survey description is required before publishing.",
        )

    if not survey.questions:
        raise HTTPException(
            status_code=400,
            detail="Add at least one question before publishing.",
        )

    question_orders = [
        question.display_order
        for question in survey.questions
    ]

    if len(question_orders) != len(set(question_orders)):
        raise HTTPException(
            status_code=400,
            detail="Question display orders must be unique before publishing.",
        )

    for question in survey.questions:
        question_type = (question.question_type or "").strip().lower()

        if question_type not in SUPPORTED_QUESTION_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported question type: {question.question_type}",
            )

        if not question.question_text or not question.question_text.strip():
            raise HTTPException(
                status_code=400,
                detail="All questions must have text before publishing.",
            )

        if question_type in CHOICE_TYPES:
            if len(question.options) < 2:
                raise HTTPException(
                    status_code=400,
                    detail=f"{question.question_text} needs at least two options before publishing.",
                )

            option_orders = [
                option.display_order
                for option in question.options
            ]

            if len(option_orders) != len(set(option_orders)):
                raise HTTPException(
                    status_code=400,
                    detail=f"Options for {question.question_text} must have unique display orders.",
                )

            option_labels = [
                option.option_text.strip().lower()
                for option in question.options
                if option.option_text and option.option_text.strip()
            ]

            if len(option_labels) != len(question.options):
                raise HTTPException(
                    status_code=400,
                    detail=f"All options for {question.question_text} must have text.",
                )

            if len(option_labels) != len(set(option_labels)):
                raise HTTPException(
                    status_code=400,
                    detail=f"Duplicate options are not allowed for {question.question_text}.",
                )

        elif question.options:
            raise HTTPException(
                status_code=400,
                detail=f"{question.question_text} cannot have options.",
            )


def publish_survey(db:Session, survey_id:int):
    survey  = db.query(Survey).filter(Survey.id == survey_id).first()
    if survey is None:
        return None

    validate_survey_for_publish(survey)
    
    survey.is_published = True
    db.commit() 
    db.refresh(survey)

    return survey

# Unpublish survey and disable public access
def unpublish_survey(db: Session, survey_id: int):
    survey = (
        db.query(Survey)
        .filter(Survey.id == survey_id)
        .first()
    )

    if survey is None:
        return None

    survey.is_published = False

    db.commit()
    db.refresh(survey)

    return survey

def get_survey_with_questions(db: Session, survey_id: int):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()

    if survey is None:
        return None
    
    return survey
