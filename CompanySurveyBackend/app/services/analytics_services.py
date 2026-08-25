from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.response import Response
from app.models.survey import Survey


def get_survey_analytics(
    db: Session,
    survey_id: int,
):
    # ===========================================
    # Check if Survey Exists
    # ===========================================

    survey = (
        db.query(Survey)
        .filter(Survey.id == survey_id)
        .first()
    )

    if survey is None:
        return None

    # ===========================================
    # Get Survey Questions
    # ===========================================

    questions = (
        db.query(Question)
        .filter(Question.survey_id == survey_id)
        .order_by(Question.display_order)
        .all()
    )

    # ===========================================
    # Total Unique Survey Responses
    # ===========================================

    total_responses = (
        db.query(Response.submission_id) #user_id changed to submission_id for the survey analytics to count unique responses based on submission_id instead of user_id
        .filter(Response.survey_id == survey_id)
        .distinct()
        .count()
    )

    analytics = []
    all_ratings = []

    # ===========================================
    # Analytics Per Question
    # ===========================================

    for question in questions:

        responses = (
            db.query(Response)
            .filter(Response.question_id == question.id)
            .all()
        )

        # ---------------------------------------
        # Rating Question
        # ---------------------------------------

        if question.question_type == "rating":

            ratings = []

            for response in responses:
                try:
                    rating = int(response.answer)
                    ratings.append(rating)
                    all_ratings.append(rating)
                except (ValueError, TypeError):
                    continue

            question_average = (
                round(sum(ratings) / len(ratings), 2)
                if ratings
                else None
            )

            # Count how many responses selected each rating
            rating_distribution = {
                        1: ratings.count(1),
                        2: ratings.count(2),
                        3: ratings.count(3),
                        4: ratings.count(4),
                        5: ratings.count(5),
                            }

            analytics.append({
                "question": question.question_text,
                "question_type": question.question_type,
                "total_responses": len(ratings),
                "average_rating": question_average,
                "text_responses": None,
                "rating_distribution": rating_distribution,
            })

        # ---------------------------------------
        # Text Question
        # ---------------------------------------

        elif question.question_type == "text":

            text_responses = [
                response.answer
                for response in responses
                if response.answer
            ]

            analytics.append({
                "question": question.question_text,
                "question_type": question.question_type,
                "total_responses": len(text_responses),
                "average_rating": None,
                "text_responses": text_responses,
            })

    # ===========================================
    # Overall Survey Average Rating
    # ===========================================

    survey_average = (
        round(sum(all_ratings) / len(all_ratings), 2)
        if all_ratings
        else None
    )

    # ===========================================
    # Return Survey Analytics
    # ===========================================

    return {
        "survey_id": survey.id,
        "survey_title": survey.title,
        "total_responses": total_responses,
        "average_rating": survey_average,
        "questions": analytics,
        "is_published": survey.is_published,
    }