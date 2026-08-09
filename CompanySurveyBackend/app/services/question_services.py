from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.survey import Survey
from app.models.response import Response
from app.schemas.question import QuestionCreate, QuestionUpdate


def create_question(db: Session, question: QuestionCreate):
    # Check if the survey exists
    survey = db.query(Survey).filter(Survey.id == question.survey_id).first()

    if survey is None:
        return None

    db_question = Question(
        survey_id=question.survey_id,
        question_text=question.question_text,
        question_type=question.question_type,
        display_order=question.display_order,
        is_required=question.is_required,
    )

    db.add(db_question)
    db.commit()
    db.refresh(db_question)

    return db_question


def get_all_questions(db: Session):
    return db.query(Question).all()


def get_question_by_id(db: Session, question_id: int):
    return db.query(Question).filter(Question.id == question_id).first()


def update_question(db: Session, question_id: int, question_data: QuestionUpdate):
    question = db.query(Question).filter(Question.id == question_id).first()

    if question is None:
        return None

    question.question_text = question_data.question_text
    question.question_type = question_data.question_type
    question.display_order = question_data.display_order
    question.is_required = question_data.is_required

    db.commit()
    db.refresh(question)

    return question


def delete_question(db: Session, question_id: int):
    question = db.query(Question).filter(Question.id == question_id).first()

    if question is None:
        return None

    db.query(Response).filter(Response.question_id == question_id).delete(synchronize_session=False)
    db.delete(question)
    db.commit()

    return question
