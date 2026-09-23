from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.auth import get_current_user
from app.database.database import get_db
from app.dependencies.permissions import require_permission, require_survey_access
from app.models.question import Question
from app.models.survey import Survey
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionResponse, QuestionUpdate
from app.schemas.response import QuestionAnalytics, ResponseView
from app.services.analytics_services import get_question_analytics
from app.services.question_services import create_question, delete_question, get_all_questions, update_question
from app.services.response_services import get_responses_by_question

router = APIRouter(prefix="/questions", tags=["Questions"])


def load_question(db: Session, question_id: int) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return question


@router.post("/", response_model=QuestionResponse)
def add_question(question: QuestionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_permission("survey.edit"))):
    survey = db.get(Survey, question.survey_id)
    if survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    return create_question(db, question)


@router.get("/", response_model=list[QuestionResponse])
def list_questions(db: Session = Depends(get_db), current_user: User = Depends(require_survey_access)):
    return get_all_questions(db)


@router.get("/{question_id}", response_model=QuestionResponse)
def read_question(question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_survey_access)):
    return load_question(db, question_id)


@router.put("/{question_id}", response_model=QuestionResponse)
def edit_question(question_id: int, question_data: QuestionUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_permission("survey.edit"))):
    load_question(db, question_id)
    return update_question(db, question_id, question_data)


@router.delete("/{question_id}")
def remove_question(question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("survey.edit"))):
    load_question(db, question_id)
    delete_question(db, question_id)
    return {"message": "Question deleted successfully"}


@router.get("/{question_id}/responses", response_model=list[ResponseView])
def view_question_responses(question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("response.view"))):
    load_question(db, question_id)
    return get_responses_by_question(db, question_id)


@router.get("/{question_id}/analytics", response_model=QuestionAnalytics)
def view_question_analytics(question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_permission("analytics.view"))):
    load_question(db, question_id)
    analytics = get_question_analytics(db, question_id)
    if analytics is None:
        raise HTTPException(status_code=404, detail="Question analytics not found")
    return analytics
