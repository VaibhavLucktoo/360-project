from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.auth import get_current_user
from app.database.database import get_db
from app.dependencies.permissions import can_manage_survey, require_management_user
from app.models.question import Question
from app.models.survey import Survey
from app.models.user import User
from app.schemas.question import QuestionCreate, QuestionResponse, QuestionUpdate
from app.schemas.response import ResponseView
from app.services.question_services import create_question, delete_question, get_all_questions, get_question_by_id, update_question
from app.services.response_services import get_responses_by_question

router = APIRouter(prefix="/questions", tags=["Questions"])


def managed_question(db: Session, question_id: int, user: User) -> Question:
    question = db.get(Question, question_id)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    survey = db.get(Survey, question.survey_id)
    if not can_manage_survey(user, survey.created_by):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage this question")
    return question


@router.post("/", response_model=QuestionResponse)
def add_question(question: QuestionCreate, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    survey = db.get(Survey, question.survey_id)
    if survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    if not can_manage_survey(current_user, survey.created_by):
        raise HTTPException(status_code=403, detail="You cannot manage this survey")
    return create_question(db, question)


@router.get("/", response_model=list[QuestionResponse])
def list_questions(db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    return get_all_questions(db)


@router.get("/{question_id}", response_model=QuestionResponse)
def read_question(question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    return managed_question(db, question_id, current_user)


@router.put("/{question_id}", response_model=QuestionResponse)
def edit_question(question_id: int, question_data: QuestionUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    managed_question(db, question_id, current_user)
    return update_question(db, question_id, question_data)


@router.delete("/{question_id}")
def remove_question(question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    managed_question(db, question_id, current_user)
    delete_question(db, question_id)
    return {"message": "Question deleted successfully"}


@router.get("/{question_id}/responses", response_model=list[ResponseView])
def view_question_responses(question_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    managed_question(db, question_id, current_user)
    return get_responses_by_question(db, question_id)

