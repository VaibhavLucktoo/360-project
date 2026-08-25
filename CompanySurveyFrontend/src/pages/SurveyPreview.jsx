import { useEffect, useState } from "react";
import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import { getAdminSurveyQuestions } from "../services/api";

import "../styles/SurveyPreview.css";


/* Convert API question to preview format */
function normalizeQuestion(question) {
    return {
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        required: question.is_required,
        display_order: question.display_order,
    };
}


/* Keep questions in display order */
function sortQuestions(questions) {
    return [...questions].sort(
        (a, b) =>
            (a.display_order || 0) -
            (b.display_order || 0)
    );
}


function SurveyPreview() {

    const { id } = useParams();
    const navigate = useNavigate();

    const surveyId = Number(id);

    // Preview data
    const [survey, setSurvey] = useState(null);
    const [questions, setQuestions] = useState([]);

    // Page state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {

        let isMounted = true;


        async function fetchPreview() {

            try {

                setLoading(true);
                setError("");

                // Admin can preview draft or published surveys
                const payload =
                    await getAdminSurveyQuestions(
                        surveyId
                    );


                const normalizedQuestions =
                    Array.isArray(payload?.questions)
                        ? sortQuestions(
                            payload.questions.map(
                                normalizeQuestion
                            )
                        )
                        : [];


                if (isMounted) {
                    setSurvey(payload);
                    setQuestions(
                        normalizedQuestions
                    );
                }

            } catch (fetchError) {

                if (isMounted) {

                    setError(
                        fetchError.message ||
                        "Failed to load survey preview."
                    );

                }

            } finally {

                if (isMounted) {
                    setLoading(false);
                }

            }

        }


        if (surveyId) {

            fetchPreview();

        } else {

            setError("Invalid survey ID.");
            setLoading(false);

        }


        return () => {
            isMounted = false;
        };

    }, [surveyId]);


    /* Loading state */
    if (loading) {
        return (
            <div className="survey-preview-page">
                <p>Loading preview...</p>
            </div>
        );
    }


    /* Error state */
    if (error) {
        return (
            <div className="survey-preview-page">

                <Link
                    to="/dashboard"
                    className="survey-preview-back-link"
                >
                    ← Back to Dashboard
                </Link>

                <p>
                    {error}
                </p>

            </div>
        );
    }


    return (

        <div className="survey-preview-page">

            {/* Dashboard navigation */}
            <Link
                to="/dashboard"
                className="survey-preview-back-link"
            >
                ← Back to Dashboard
            </Link>


            {/* Preview header */}
            <div className="survey-preview-header">

                <h1>
                    {survey?.title || "Survey Preview"}
                </h1>

                {survey?.description && (
                    <p>
                        {survey.description}
                    </p>
                )}

            </div>


            {/* Question preview */}
            <div className="survey-preview-list">

                {questions.length === 0 ? (

                    <p className="survey-preview-empty">
                        No questions added yet.
                    </p>

                ) : (

                    questions.map(
                        (question, index) => (

                            <div
                                key={question.id}
                                className="survey-preview-question"
                            >

                                {/* Question heading */}
                                <div className="preview-question-heading">

                                    <span className="preview-question-index">
                                        {index + 1}
                                    </span>


                                    <div className="preview-question-title">

                                        <h3>

                                            {question.text}

                                            {question.required && (
                                                <span className="preview-required-star">
                                                    *
                                                </span>
                                            )}

                                        </h3>


                                        <span className="preview-question-type">
                                            {question.type}
                                        </span>

                                    </div>

                                </div>


                                {/* Text question */}
                                {question.type === "text" && (

                                    <input
                                        type="text"
                                        placeholder="Your answer"
                                        disabled
                                    />

                                )}


                                {/* Rating question */}
                                {question.type === "rating" && (

                                    <div className="preview-rating">

                                        {[1, 2, 3, 4, 5].map(
                                            (rating) => (

                                                <button
                                                    key={rating}
                                                    type="button"
                                                    disabled
                                                >
                                                    {rating}
                                                </button>

                                            )
                                        )}

                                    </div>

                                )}


                                {/* Radio question */}
                                {question.type === "radio" && (

                                    <p>
                                        Radio options will appear here.
                                    </p>

                                )}


                                {/* Checkbox question */}
                                {question.type === "checkbox" && (

                                    <p>
                                        Checkbox options will appear here.
                                    </p>

                                )}


                                {/* Dropdown question */}
                                {question.type === "dropdown" && (

                                    <select disabled>

                                        <option>
                                            Select an option
                                        </option>

                                    </select>

                                )}

                            </div>

                        )
                    )

                )}

            </div>


            {/* Builder navigation */}
            <div className="survey-preview-actions">

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            `/surveys/${surveyId}/builder`
                        )
                    }
                >
                    ← Back to Builder
                </button>

            </div>

        </div>

    );

}


export default SurveyPreview;