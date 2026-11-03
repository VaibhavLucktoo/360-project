import { removeLeadingWhitespace } from "../utils/inputWhitespace";
/* ===========================================
   Public Survey Page
=========================================== */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";

import * as API from "../services/api";

import "../styles/TakeSurvey.css";

const ANSWER_MAX_LENGTH = 2000;
const ANSWER_MAX_WORDS = 300;


function countWords(value) {
    return value.trim().split(/\s+/).filter(Boolean).length;
}


/* Keep questions in display order */
function sortQuestions(questions) {

    return [...questions].sort(
        (a, b) =>
            (a.display_order || 0) -
            (b.display_order || 0)
    );

}

// Reuse one anonymous ID for this survey in this browser
function getSubmissionId(surveyId) {
    const storageKey = `survey_submission_id_${surveyId}`;

    let submissionId = localStorage.getItem(storageKey);

    if (!submissionId) {
        submissionId = crypto.randomUUID();
        localStorage.setItem(storageKey, submissionId);
    }

    return submissionId;
}


function TakeSurvey() {

    const { id } = useParams();

    // Stores whether this survey was completed in this browser
    const submittedStorageKey = `survey_submitted_${id}`;

    // Keep the same anonymous ID even after refresh
    const [submissionId] = useState(() =>
        getSubmissionId(id)
    );


    // Survey data
    const [survey, setSurvey] = useState(null);
    const [questions, setQuestions] = useState([]);

    // Employee answers
    const [answers, setAnswers] = useState({});

    // Page state
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formError, setFormError] = useState("");

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Restore submitted state after a page refresh
    const [submitted, setSubmitted] = useState(
    () => localStorage.getItem(submittedStorageKey) === "true");


    /* Update normal answer */
    function handleAnswerChange(questionId, value) {

        setAnswers((previousAnswers) => ({
            ...previousAnswers,
            [questionId]: typeof value === "string" ? removeLeadingWhitespace(value) : value,
        }));

    }


    /*
    Reserved for future checkbox/multi-select support.

    function handleCheckboxChange(questionId, optionValue, checked) {
        setAnswers((previousAnswers) => {
            const selectedOptions = Array.isArray(previousAnswers[questionId])
                ? previousAnswers[questionId]
                : [];

            return {
                ...previousAnswers,
                [questionId]: checked
                    ? [...selectedOptions, optionValue]
                    : selectedOptions.filter((value) => value !== optionValue),
            };
        });
    }
    */


    /* Update rating */
    function handleRatingChange(questionId, rating) {

        handleAnswerChange(
            questionId,
            String(rating)
        );

    }


    /* Validate required questions */
    function validateSurvey() {

        for (const question of questions) {

            if (!question.is_required) {
                continue;
            }

            const answer =
                answers[question.id];


            const hasEmptyValue =
                answer === undefined ||
                answer === null ||
                (
                    typeof answer === "string" &&
                    answer.trim() === ""
                );


            const hasEmptySelection =
                Array.isArray(answer) &&
                answer.length === 0;


            if (
                hasEmptyValue ||
                hasEmptySelection
            ) {

                setFormError(
                    `Please answer: ${question.question_text}`
                );


                Swal.fire({
                    icon: "warning",
                    title: "Required Question Missing",
                    text: "Please answer all required questions before submitting the survey.",
                    confirmButtonText: "Review Questions",
                });


                return false;
            }

        }


        for (const question of questions) {

            if (
                !["text", "textarea"].includes(
                    question.question_type
                )
            ) {
                continue;
            }

            const answer =
                answers[question.id];

            if (
                typeof answer === "string" &&
                countWords(answer) > ANSWER_MAX_WORDS
            ) {

                setFormError(
                    `Answer is too long for: ${question.question_text}`
                );


                Swal.fire({
                    icon: "warning",
                    title: "Answer Too Long",
                    text: `Please keep text answers within ${ANSWER_MAX_WORDS} words.`,
                    confirmButtonText: "Review Answer",
                });


                return false;
            }

        }


        setFormError("");

        return true;
    }


    /* Submit survey */
    async function handleSubmit(event) {

        event.preventDefault();


        // Prevent duplicate submission
        if (isSubmitting || submitted) {
            return;
        }


        if (!validateSurvey()) {
            return;
        }


        const confirmation = await Swal.fire({
            icon: "question",
            title: "Submit Survey?",
            text: "You won’t be able to change your answers after submission.",
            showCancelButton: true,
            confirmButtonText: "Submit Survey",
            cancelButtonText: "Review Answers",
        });


        if (!confirmation.isConfirmed) {
            return;
        }


        const payload =
            Object.entries(answers).map(
                ([questionId, answer]) => ({
                    question_id: Number(questionId),
                    answer,
                })
            );


        try {

            setIsSubmitting(true);


            await API.submitSurvey(
                id,
                submissionId,
                payload
            );

            // Remember successful submission across refreshes
            localStorage.setItem(
                submittedStorageKey,
                "true"
            );

            setSubmitted(true);


            setAnswers({});

            


            await Swal.fire({
                icon: "success",
                title: "Survey Submitted",
                text: "Thank you for completing the survey.",
                timer: 1600,
                showConfirmButton: false,
                timerProgressBar: true,
            });


        } catch (error) {

    console.error(error);

    // Backend confirmed this browser already submitted
    if (error.status === 409) {

        localStorage.setItem(
            submittedStorageKey,
            "true"
        );

        setSubmitted(true);

        await Swal.fire({
            icon: "info",
            title: "Already Submitted",
            text: "This survey has already been submitted from this browser.",
            confirmButtonText: "OK",
        });

        return;
    }

    await Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: error.message || "Something went wrong.",
    });

} finally {

    // Runs after success or failure
    setIsSubmitting(false);
}

    }


    /* Load published survey */
    useEffect(() => {

        let isMounted = true;


        async function fetchSurvey() {

            try {

                setLoading(true);
                setLoadError("");
                setFormError("");


                const data =
                    await API.getSurveyQuestions(id);


                if (!isMounted) {
                    return;
                }


                setSurvey(data);

                setQuestions(
                    sortQuestions(
                        data.questions || []
                    )
                );


            } catch (error) {

                console.error(
                    "Survey loading error:",
                    error
                );


                if (isMounted) {

                    setLoadError(
                        "This survey is unavailable or no longer accepting responses."
                    );

                }


            } finally {

                if (isMounted) {
                    setLoading(false);
                }

            }

        }


        fetchSurvey();


        return () => {
            isMounted = false;
        };

    }, [id]);


    /* Loading state */
    if (loading) {

        return (
            <div className="take-survey-state">

                <div className="survey-state-card">

                    <div className="survey-loader" />

                    <h2>
                        Loading Survey
                    </h2>

                    <p>
                        Please wait a moment.
                    </p>

                </div>

            </div>
        );

    }


    /* Error state */
    if (loadError) {

        return (
            <div className="take-survey-state">

                <div className="survey-state-card">

                    <div className="survey-state-icon">
                        !
                    </div>

                    <h2>
                        Survey Unavailable
                    </h2>

                    <p>
                        {loadError}
                    </p>

                </div>

            </div>
        );

    }


    /* Submitted state */
    if (submitted) {

        return (
            <div className="take-survey-state">

                <div className="survey-state-card success">

                    <div className="survey-success-icon">
                        ✓
                    </div>

                    <h1>
                        Thank You
                    </h1>

                    <p>
                        Your response has been submitted successfully.
                    </p>

                    <span className="survey-complete-note">
                        You can now close this page.
                    </span>

                </div>

            </div>
        );

    }


    const answeredCount = questions.filter((question) => {
        const val = answers[question.id];
        return val !== undefined && val !== null && String(val).trim() !== "";
    }).length;

    const progressPercent = questions.length > 0
        ? Math.round((answeredCount / questions.length) * 100)
        : 0;

    return (

        <main className="take-survey-page">

            <div className="take-survey-container">


                {/* Survey heading */}

                <header className="take-survey-header">

                    <div className="survey-header-badge">
                        🔒 100% Confidential &amp; Anonymous Suggestion Box
                    </div>

                    <h1>
                        {survey?.title}
                    </h1>

                    {survey?.description && (

                        <p>
                            {survey.description}
                        </p>

                    )}

                    <div className="survey-progress-box">
                        <div className="survey-progress-info">
                            <span>Progress</span>
                            <strong>{answeredCount} of {questions.length} answered ({progressPercent}%)</strong>
                        </div>
                        <div className="survey-progress-track">
                            <div className="survey-progress-bar" style={{ width: `${progressPercent}%` }} />
                        </div>
                    </div>

                    <div className="survey-header-meta">

                        <span>
                            {questions.length}{" "}
                            {questions.length === 1
                                ? "Question"
                                : "Questions"}
                        </span>

                        <span>
                            Zero tracking • Identity protected
                        </span>

                    </div>

                </header>


                {/* Validation message */}

                {formError && (

                    <div
                        className="survey-form-error"
                        role="alert"
                    >
                        <strong>
                            Required:
                        </strong>

                        <span>
                            {formError}
                        </span>
                    </div>

                )}


                {/* Questions */}

                {questions.length === 0 ? (

                    <div className="survey-empty-state">

                        <h2>
                            No Questions Available
                        </h2>

                        <p>
                            This survey currently has no questions.
                        </p>

                    </div>

                ) : (

                    <form
                        className="take-survey-form"
                        onSubmit={handleSubmit}
                    >

                        {questions.map(
                            (question, index) => {

                                const options =
                                    question.options || [];

                                return (

                                    <section
                                        key={question.id}
                                        className="take-question-card"
                                    >

                                        <div className="question-heading">

                                            <span className="question-index">
                                                {index + 1}
                                            </span>

                                            <div>

                                                <h2>

                                                    {question.question_text}

                                                    {question.is_required && (

                                                        <span
                                                            className="required-star"
                                                            aria-label="required"
                                                        >
                                                            *
                                                        </span>

                                                    )}

                                                </h2>

                                                <span className="question-type-label">
                                                    {question.question_type}
                                                </span>

                                            </div>

                                        </div>


                                        <div
                                            className={
                                                question.question_type === "rating"
                                                    ? "question-answer rating-answer"
                                                    : "question-answer"
                                            }
                                        >


                                            {/* Text */}

                                            {question.question_type ===
                                                "text" && (

                                                <input
                                                    className="survey-text-input"
                                                    type="text"
                                                    placeholder="Type your answer..."
                                                    maxLength={ANSWER_MAX_LENGTH}
                                                    value={
                                                        answers[
                                                            question.id
                                                        ] || ""
                                                    }
                                                    onChange={(event) =>
                                                        handleAnswerChange(
                                                            question.id,
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                            )}


                                            {/* Textarea */}

                                            {question.question_type ===
                                                "textarea" && (

                                                <textarea
                                                    className="survey-textarea"
                                                    rows="5"
                                                    placeholder="Type your answer..."
                                                    maxLength={ANSWER_MAX_LENGTH}
                                                    value={
                                                        answers[
                                                            question.id
                                                        ] || ""
                                                    }
                                                    onChange={(event) =>
                                                        handleAnswerChange(
                                                            question.id,
                                                            event.target.value
                                                        )
                                                    }
                                                />

                                            )}


                                            {/* Rating */}

                                            {question.question_type ===
                                                "rating" && (

                                                <div className="survey-rating">

                                                    {[1, 2, 3, 4, 5].map(
                                                        (rating) => {

                                                            const selected =
                                                                answers[
                                                                    question.id
                                                                ] ===
                                                                String(
                                                                    rating
                                                                );


                                                            return (

                                                                <button
                                                                    key={rating}
                                                                    type="button"
                                                                    className={
                                                                        selected
                                                                            ? "rating-button selected"
                                                                            : "rating-button"
                                                                    }
                                                                    onClick={() =>
                                                                        handleRatingChange(
                                                                            question.id,
                                                                            rating
                                                                        )
                                                                    }
                                                                    aria-pressed={
                                                                        selected
                                                                    }
                                                                >
                                                                    {rating}
                                                                </button>

                                                            );

                                                        }
                                                    )}

                                                </div>

                                            )}


                                            {/* Radio */}

                                            {question.question_type ===
                                                "radio" && (

                                                options.length > 0 ? (

                                                    <div className="survey-options">

                                                        {options.map(
                                                            (option) => {

                                                                const optionValue =
                                                                    String(
                                                                        option.id
                                                                    );

                                                                return (

                                                                    <label
                                                                        key={
                                                                            option.id
                                                                        }
                                                                        className="survey-option"
                                                                    >

                                                                        <input
                                                                            type="radio"
                                                                            name={`question-${question.id}`}
                                                                            value={
                                                                                optionValue
                                                                            }
                                                                            checked={
                                                                                answers[
                                                                                    question.id
                                                                                ] ===
                                                                                optionValue
                                                                            }
                                                                            onChange={(event) =>
                                                                                handleAnswerChange(
                                                                                    question.id,
                                                                                    event.target.value
                                                                                )
                                                                            }
                                                                        />

                                                                        <span>
                                                                            {
                                                                                option.option_text
                                                                            }
                                                                        </span>

                                                                    </label>

                                                                );

                                                            }
                                                        )}

                                                    </div>

                                                ) : (

                                                    <p className="options-unavailable">
                                                        No options available.
                                                    </p>

                                                )

                                            )}


                                            {/*
                                            Checkbox support is reserved for future multi-select support.

                                            {question.question_type === "checkbox" && (
                                                options.length > 0 ? (
                                                    <div className="survey-options">
                                                        ...
                                                    </div>
                                                ) : (
                                                    <p className="options-unavailable">
                                                        No options available.
                                                    </p>
                                                )
                                            )}
                                            */}


                                            {/* Dropdown */}

                                            {question.question_type ===
                                                "dropdown" && (

                                                options.length > 0 ? (

                                                    <select
                                                        className="survey-select"
                                                        value={
                                                            answers[
                                                                question.id
                                                            ] || ""
                                                        }
                                                        onChange={(event) =>
                                                            handleAnswerChange(
                                                                question.id,
                                                                event.target.value
                                                            )
                                                        }
                                                    >

                                                        <option value="">
                                                            Select an option
                                                        </option>

                                                        {options.map(
                                                            (option) => (

                                                                <option
                                                                    key={
                                                                        option.id
                                                                    }
                                                                    value={
                                                                        String(
                                                                            option.id
                                                                        )
                                                                    }
                                                                >
                                                                    {
                                                                        option.option_text
                                                                    }
                                                                </option>

                                                            )
                                                        )}

                                                    </select>

                                                ) : (

                                                    <p className="options-unavailable">
                                                        No options available.
                                                    </p>

                                                )

                                            )}

                                        </div>

                                    </section>

                                );

                            }
                        )}


                        {/* Submit */}

                        <div className="survey-submit-area">

                            <p>
                                Please review your answers before submitting.
                            </p>

                            <button
                                type="submit"
                                className="survey-submit-button"
                                disabled={isSubmitting}
                            >

                                {isSubmitting
                                    ? "Submitting..."
                                    : "Submit Survey"}

                            </button>

                        </div>

                    </form>

                )}

            </div>

        </main>

    );

}


export default TakeSurvey;
