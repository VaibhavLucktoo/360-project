from collections import Counter

from sqlalchemy.orm import Session

from app.models.question import Question
from app.models.response import Response
from app.models.survey import Survey


# Question types that use selectable options.
CHOICE_TYPES = {
    "radio",
    "dropdown",
    # "checkbox" can be added back when multi-select questions return.
}


# ===========================================
# Resolve Choice Answer
# ===========================================

def resolve_choice_answer(
    question: Question,
    answer: str,
):
    """
    Convert stored option IDs into readable labels.

    Example:
    Stored value: "2"
    Display value: "Remote"
    """

    if not answer:
        return None


    # Map option ID -> option label.
    option_map = {
        str(option.id): option.option_text
        for option in question.options
    }


    # Supports a single option now.
    # Comma-separated values can be restored when checkbox returns.
    values = [
        value.strip()
        for value in str(answer).split(",")
        if value.strip()
    ]


    readable_values = [
        option_map.get(value, value)
        for value in values
    ]


    return ", ".join(readable_values)


# ===========================================
# Survey Analytics
# ===========================================

def get_survey_analytics(
    db: Session,
    survey_id: int,
):

    # ===========================================
    # Check Survey
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
        .filter(
            Question.survey_id == survey_id
        )
        .order_by(
            Question.display_order
        )
        .all()
    )


    # ===========================================
    # Count Unique Survey Submissions
    # ===========================================

    total_responses = (
        db.query(
            Response.submission_id
        )
        .filter(
            Response.survey_id == survey_id,
            Response.submission_id.isnot(None),
        )
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
            .filter(
                Response.survey_id == survey_id,
                Response.question_id == question.id,
            )
            .all()
        )


        question_type = (
            question.question_type
            .strip()
            .lower()
        )


        # =======================================
        # Rating
        # =======================================

        if question_type == "rating":

            ratings = []


            for response in responses:

                try:

                    rating = int(
                        response.answer
                    )


                    # Only accept valid 1–5 ratings.
                    if 1 <= rating <= 5:

                        ratings.append(
                            rating
                        )

                        all_ratings.append(
                            rating
                        )


                except (
                    ValueError,
                    TypeError,
                ):

                    continue


            question_average = (

                round(
                    sum(ratings) /
                    len(ratings),
                    2,
                )

                if ratings

                else None

            )


            # Count ratings from 1 to 5.
            rating_distribution = {

                rating:
                    ratings.count(rating)

                for rating in range(
                    1,
                    6,
                )

            }


            analytics.append({

                "question_id":
                    question.id,

                "question":
                    question.question_text,

                "question_type":
                    question_type,

                "total_responses":
                    len(ratings),

                "average_rating":
                    question_average,

                "rating_distribution":
                    rating_distribution,

                "answer_breakdown":
                    None,

                "yes_count":
                    None,

                "no_count":
                    None,

                "text_responses":
                    None,

            })


        # =======================================
        # Radio / Dropdown / Checkbox
        # =======================================

        elif question_type in CHOICE_TYPES:

            readable_answers = []


            for response in responses:

                readable_answer = (
                    resolve_choice_answer(
                        question,
                        response.answer,
                    )
                )


                if readable_answer:

                    readable_answers.append(
                        readable_answer
                    )


            # Count each selected option.
            answer_breakdown = dict(
                Counter(
                    readable_answers
                )
            )


            # Optional Yes / No counters.
            yes_count = sum(

                count

                for answer, count
                in answer_breakdown.items()

                if answer.strip().lower()
                == "yes"

            )


            no_count = sum(

                count

                for answer, count
                in answer_breakdown.items()

                if answer.strip().lower()
                == "no"

            )


            analytics.append({

                "question_id":
                    question.id,

                "question":
                    question.question_text,

                "question_type":
                    question_type,

                "total_responses":
                    len(readable_answers),

                "average_rating":
                    None,

                "rating_distribution":
                    None,

                "answer_breakdown":
                    answer_breakdown,

                "yes_count":
                    yes_count,

                "no_count":
                    no_count,

                "text_responses":
                    None,

            })


        # =======================================
        # Text / Textarea
        # =======================================

        elif question_type in {
            "text",
            "textarea",
        }:

            text_responses = [

                response.answer.strip()

                for response in responses

                if (
                    response.answer
                    and
                    response.answer.strip()
                )

            ]


            analytics.append({

                "question_id":
                    question.id,

                "question":
                    question.question_text,

                "question_type":
                    question_type,

                "total_responses":
                    len(text_responses),

                "average_rating":
                    None,

                "rating_distribution":
                    None,

                "answer_breakdown":
                    None,

                "yes_count":
                    None,

                "no_count":
                    None,

                "text_responses":
                    text_responses,

            })


        # =======================================
        # Unknown / Future Question Type
        # =======================================

        else:

            analytics.append({

                "question_id":
                    question.id,

                "question":
                    question.question_text,

                "question_type":
                    question_type,

                "total_responses":
                    len(responses),

                "average_rating":
                    None,

                "rating_distribution":
                    None,

                "answer_breakdown":
                    None,

                "yes_count":
                    None,

                "no_count":
                    None,

                "text_responses":
                    None,

            })


    # ===========================================
    # Overall Survey Average Rating
    # ===========================================

    survey_average = (

        round(
            sum(all_ratings) /
            len(all_ratings),
            2,
        )

        if all_ratings

        else None

    )


    # ===========================================
    # Return Analytics
    # ===========================================

    return {

        "survey_id":
            survey.id,

        "survey_title":
            survey.title,

        # Number of complete submissions,
        # not number of answer rows.
        "total_responses":
            total_responses,

        "average_rating":
            survey_average,

        "questions":
            analytics,

        "is_published":
            survey.is_published,
    }


def get_question_analytics(
    db: Session,
    question_id: int,
):
    question = (
        db.query(Question)
        .filter(Question.id == question_id)
        .first()
    )

    if question is None:
        return None

    survey_analytics = get_survey_analytics(
        db,
        question.survey_id,
    )

    if survey_analytics is None:
        return None

    for question_analytics in survey_analytics["questions"]:
        if question_analytics["question_id"] == question_id:
            return question_analytics

    return None
