from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.auth import get_current_user
from app.database.database import get_db
from app.dependencies.permissions import can_manage_survey, require_management_user
from app.models.survey import Survey
from app.models.user import User
from app.schemas.response import ResponseCreate, ResponseResponse, ResponseUpdate
from app.services.response_services import create_response, delete_response, get_all_responses, get_response_by_id, update_response

router = APIRouter(prefix="/responses", tags=["Responses"])


def can_manage_response(response, db, user):
    survey = db.get(Survey, response.survey_id)
    return survey and can_manage_survey(user, survey.created_by)


@router.post("/", response_model=ResponseResponse)
def add_response(response: ResponseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    created = create_response(db, response, current_user.id)
    if created is None:
        raise HTTPException(status_code=400, detail="Question not found or already answered")
    return created


@router.get("/", response_model=list[ResponseResponse])
def list_responses(db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    if current_user.role.strip().lower() == "admin":
        return get_all_responses(db)
    return [response for response in get_all_responses(db) if can_manage_response(response, db, current_user)]


@router.put("/{response_id}", response_model=ResponseResponse)
def edit_response(response_id: int, response_data: ResponseUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    response = get_response_by_id(db, response_id)
    if response is None:
        raise HTTPException(status_code=404, detail="Response not found")
    if not can_manage_response(response, db, current_user):
        raise HTTPException(status_code=403, detail="You cannot manage this response")
    return update_response(db, response_id, response_data)


@router.delete("/{response_id}")
def remove_response(response_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    response = get_response_by_id(db, response_id)
    if response is None:
        raise HTTPException(status_code=404, detail="Response not found")
    if not can_manage_response(response, db, current_user):
        raise HTTPException(status_code=403, detail="You cannot manage this response")
    delete_response(db, response_id)
    return {"message": "Response deleted successfully"}
