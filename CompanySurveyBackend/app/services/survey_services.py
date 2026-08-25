from sqlalchemy.orm import Session

from app.models.survey import Survey
from app.models.question import Question
from app.models.response import Response
from app.schemas.survey import SurveyCreate, SurveyUpdate


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

    db.query(Response).filter(Response.survey_id == survey_id).delete(synchronize_session=False)
    db.query(Question).filter(Question.survey_id == survey_id).delete(synchronize_session=False)
    db.delete(survey)
    db.commit()
    return survey

def publish_survey(db:Session, survey_id:int):
    survey  = db.query(Survey).filter(Survey.id == survey_id).first()
    if survey is None:
        return None
    
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
