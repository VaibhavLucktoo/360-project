import PermissionGate from "../components/PermissionGate";
import { useEffect, useState } from "react";
import {
    Link,
    useNavigate,
    useParams,
} from "react-router-dom";

import Sidebar from "../components/Sidebar";
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
        options: Array.isArray(question.options)
            ? [...question.options].sort(
                (firstOption, secondOption) =>
                    (firstOption.display_order || 0) -
                    (secondOption.display_order || 0)
            )
            : [],
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

                if (!surveyId) {

                    setError("Invalid survey ID.");
                    setLoading(false);

                    return;
                }


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


        fetchPreview();


        return () => {
            isMounted = false;
        };

    }, [surveyId]);


    /* Loading state */
    if (loading) {
        return (
            <>
                <Sidebar />

                <main className="survey-preview-page">
                    <p>Loading preview...</p>
                </main>
            </>
        );
    }


    /* Error state */
    if (error) {
        return (
            <>
                <Sidebar />

                <main className="survey-preview-page">
                    <Link
                        to="/dashboard"
                        className="survey-preview-back-link"
                    >
                        Back to Dashboard
                    </Link>

                    <p>
                        {error}
                    </p>
                </main>

            </>
        );
    }


    return (

        <>
            <Sidebar />

            <main className="survey-preview-page">

            {/* Dashboard navigation */}
            <Link
                to="/dashboard"
                className="survey-preview-back-link"
            >
                Back to Dashboard
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

                                    question.options.length > 0 ? (

                                        <div className="survey-options">

                                            {question.options.map(
                                                (option) => (

                                                    <label
                                                        key={option.id}
                                                        className="survey-option"
                                                    >

                                                        <input
                                                            type="radio"
                                                            disabled
                                                        />

                                                        <span>
                                                            {
                                                                option.option_text
                                                            }
                                                        </span>

                                                    </label>

                                                )
                                            )}

                                        </div>

                                    ) : (

                                        <p>
                                            No options available.
                                        </p>

                                    )

                                )}


                                {/*
                                Checkbox support is reserved for future multi-select support.

                                {question.type === "checkbox" && (
                                    <p>
                                        Checkbox options will appear here.
                                    </p>
                                )}
                                */}


                                {/* Dropdown question */}
                                {question.type === "dropdown" && (

                                    <select disabled>

                                        <option>
                                            Select an option
                                        </option>

                                        {question.options.map(
                                            (option) => (

                                                <option
                                                    key={option.id}
                                                >
                                                    {
                                                        option.option_text
                                                    }
                                                </option>

                                            )
                                        )}

                                    </select>

                                )}

                            </div>

                        )
                    )

                )}

            </div>


            {/* Builder navigation */}
            <div className="survey-preview-actions">

                <PermissionGate permission="survey.edit"><button
                    type="button"
                    onClick={() =>
                        navigate(
                            `/surveys/${surveyId}/builder`
                        )
                    }
                >
                    Back to Builder
                </button></PermissionGate>

            </div>

            </main>
        </>

    );

}


export default SurveyPreview;
