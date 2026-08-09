import csv
from collections import Counter
from io import StringIO

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.response import Response
from app.models.survey import Survey
from app.schemas.response import ResponseCreate, ResponseUpdate, SurveySubmission


def create_response(db: Session, response: ResponseCreate, current_user_id: int):
    question = db.get(Question, response.question_id)
    if question is None:
        return None
    if db.query(Response).filter_by(user_id=current_user_id, question_id=question.id).first():
        return None
    item = Response(survey_id=question.survey_id, user_id=current_user_id, question_id=question.id, answer=response.answer.strip())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def get_all_responses(db: Session, survey_id: int | None = None):
    query = db.query(Response)
    return query.filter(Response.survey_id == survey_id).all() if survey_id else query.all()


def get_response_by_id(db: Session, response_id: int):
    return db.get(Response, response_id)


def update_response(db: Session, response_id: int, response_data: ResponseUpdate):
    response = db.get(Response, response_id)
    if response is None:
        return None
    response.answer = response_data.answer.strip()
    db.commit(); db.refresh(response)
    return response


def delete_response(db: Session, response_id: int):
    response = db.get(Response, response_id)
    if response is None:
        return None
    db.delete(response); db.commit()
    return response


def submit_survey(db: Session, survey_id: int, user_id: int, submission: SurveySubmission):
    survey = db.get(Survey, survey_id)
    if survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    if not survey.is_published:
        raise HTTPException(status_code=400, detail="Survey is not published")
    questions = {question.id: question for question in survey.questions}
    submitted = {answer.question_id: answer.answer.strip() for answer in submission.answers}
    if len(submitted) != len(submission.answers) or any(question_id not in questions for question_id in submitted):
        raise HTTPException(status_code=400, detail="One or more answers do not belong to this survey")
    missing = [q.question_text for q in questions.values() if q.is_required and not submitted.get(q.id)]
    if missing:
        raise HTTPException(status_code=400, detail=f"Required questions are unanswered: {', '.join(missing)}")
    if db.query(Response).filter_by(survey_id=survey_id, user_id=user_id).first():
        raise HTTPException(status_code=400, detail="You have already submitted this survey")
    for question_id, answer in submitted.items():
        if answer:
            db.add(Response(survey_id=survey_id, user_id=user_id, question_id=question_id, answer=answer))
    db.commit()
    return {"message": "Survey submitted successfully"}


def get_responses_by_question(db: Session, question_id: int):
    return db.query(Response).filter_by(question_id=question_id).all()


def get_responses_by_survey(db: Session, survey_id: int):
    return db.query(Response).filter_by(survey_id=survey_id).all()


def get_question_analytics(db: Session, question: Question):
    answers = [row.answer for row in db.query(Response.answer).filter_by(question_id=question.id).all()]
    question_type = question.question_type.lower()
    result = {"question_id": question.id, "question": question.question_text, "question_type": question_type,
              "total_responses": len(answers), "average_rating": None, "yes_count": None, "no_count": None,
              "answer_breakdown": None, "text_responses": None}
    if question_type == "rating":
        ratings = [int(answer) for answer in answers if answer.isdigit() and 1 <= int(answer) <= 5]
        result["average_rating"] = round(sum(ratings) / len(ratings), 2) if ratings else None
    elif question_type in {"yes/no", "yes_no", "radio", "checkbox", "dropdown"}:
        values = [value.strip() for answer in answers for value in answer.split(",") if value.strip()]
        counts = Counter(values)
        result["answer_breakdown"] = dict(counts)
        result["yes_count"] = sum(count for value, count in counts.items() if value.lower() == "yes")
        result["no_count"] = sum(count for value, count in counts.items() if value.lower() == "no")
    else:
        result["text_responses"] = answers
    return result


def get_survey_analytics(db: Session, survey_id: int):
    """Return only anonymous survey participation metadata for the current phase."""
    survey = db.get(Survey, survey_id)
    if survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    participants = db.query(Response.user_id).filter_by(survey_id=survey_id).distinct().count()
    # Do not include user identity, departments, answers, or question-level data here.
    return {"survey_id": survey.id, "survey_title": survey.title, "total_responses": participants,
            "is_published": survey.is_published}


def export_survey_csv(db: Session, survey_id: int):
    survey = db.get(Survey, survey_id)
    if survey is None:
        raise HTTPException(status_code=404, detail="Survey not found")
    output = StringIO(); writer = csv.writer(output)
    writer.writerow(["Question", "Question Type", "Answer"])
    for question in survey.questions:
        for response in question.responses:
            writer.writerow([question.question_text, question.question_type, response.answer])
    output.seek(0)
    return output
