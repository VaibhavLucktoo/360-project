from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.models.survey import Survey
from app.auth.auth import get_current_user
from app.database.database import get_db
from app.dependencies.permissions import (
    can_manage_survey,
    require_management_user,
)

from app.models.user import User

from app.schemas.response import (
    ResponseView,
    SurveyAnalytics,
    SurveySubmission,
)

from app.schemas.survey import (
    SurveyCreate,
    SurveyResponse,
    SurveyUpdate,
    SurveyWithQuestions,
)

from app.services.analytics_services import get_survey_analytics

from app.services.response_services import (
    export_survey_csv,
    get_responses_by_survey,
    submit_survey,
)

from app.services.survey_services import (
    create_survey,
    delete_survey,
    get_all_surveys,
    get_survey_by_id,
    get_survey_with_questions,
    publish_survey,
    update_survey,
)
router = APIRouter(prefix="/surveys", tags=["Surveys"])


def managed_survey(db: Session, survey_id: int, user: User) -> Survey:
    """Load a survey and enforce the admin-only content-management policy."""
    survey = db.get(Survey, survey_id)
    if survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    if not can_manage_survey(user, survey.created_by):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot manage this survey")
    return survey


@router.post("/", response_model=SurveyResponse)
def add_survey(survey: SurveyCreate, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    return create_survey(db, survey, current_user.id)


@router.get("/", response_model=list[SurveyResponse])
def get_surveys(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    surveys = get_all_surveys(db)
    # Every non-admin role is a survey respondent, including managers.
    if not current_user.role or current_user.role.strip().lower() != "admin":
        return [survey for survey in surveys if survey.is_published]
    return surveys


@router.get("/{survey_id}", response_model=SurveyResponse)
def get_survey(survey_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    survey = get_survey_by_id(db, survey_id)
    if survey is None or (current_user.role.strip().lower() != "admin" and not survey.is_published):
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


@router.put("/{survey_id}", response_model=SurveyResponse)
def edit_survey(survey_id: int, survey_data: SurveyUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    managed_survey(db, survey_id, current_user)
    return update_survey(db, survey_id, survey_data)


@router.delete("/{survey_id}")
def remove_survey(survey_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    managed_survey(db, survey_id, current_user)
    delete_survey(db, survey_id)
    return {"message": "Survey deleted successfully"}


@router.put("/{survey_id}/publish", response_model=SurveyResponse)
def publish_survey_api(survey_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    managed_survey(db, survey_id, current_user)
    return publish_survey(db, survey_id)


@router.get("/{survey_id}/questions", response_model=SurveyWithQuestions)
def get_survey_with_questions_api(survey_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    survey = get_survey_with_questions(db, survey_id)
    if survey is None or (current_user.role.strip().lower() != "admin" and not survey.is_published):
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


@router.post("/{survey_id}/submit")
def submit_employee_survey(survey_id: int, submission: SurveySubmission, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return submit_survey(db, survey_id, current_user.id, submission)


@router.get("/{survey_id}/responses", response_model=list[ResponseView])
def view_survey_responses(survey_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    managed_survey(db, survey_id, current_user)
    return get_responses_by_survey(db, survey_id)


@router.get("/{survey_id}/analytics", response_model=SurveyAnalytics)
def view_survey_analytics(
    survey_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_management_user),
):
    """
    Return anonymous survey-level analytics.
    Accessible only to administrators/managers.
    """

    # Ensure the user can manage this survey
    managed_survey(db, survey_id, current_user)

    analytics = get_survey_analytics(db, survey_id)

    if analytics is None:
        raise HTTPException(
            status_code=404,
            detail="Survey not found.",
        )

    return analytics


@router.get("/{survey_id}/export")
def export_survey(survey_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_management_user)):
    managed_survey(db, survey_id, current_user)
    return StreamingResponse(export_survey_csv(db, survey_id), media_type="text/csv", headers={"Content-Disposition": f"attachment; filename=survey_{survey_id}.csv"})
