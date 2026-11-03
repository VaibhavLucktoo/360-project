import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
    FaSun,
    FaMoon,
    FaShieldAlt,
    FaLock,
    FaCheck,
    FaCheckCircle,
    FaExclamationCircle,
    FaPaperPlane,
    FaAlignLeft,
    FaRegDotCircle,
    FaListUl,
    FaStar,
} from "react-icons/fa";

import { useTheme } from "../context/useTheme";
import { removeLeadingWhitespace } from "../utils/inputWhitespace";
import { parseRatingQuestion } from "../utils/ratingStyles";
import * as API from "../services/api";

import "../styles/TakeSurvey.css";

const ANSWER_MAX_LENGTH = 2000;
const ANSWER_MAX_WORDS = 300;

function countWords(value) {
    return value.trim().split(/\s+/).filter(Boolean).length;
}

/* Sentiment descriptions for 1-5 emotional rating scale */
const RATING_SENTIMENTS = {
    1: { label: "Strongly Disagree", mood: "Very Low" },
    2: { label: "Disagree", mood: "Low" },
    3: { label: "Neutral", mood: "Neutral" },
    4: { label: "Agree", mood: "High" },
    5: { label: "Strongly Agree", mood: "Very High" },
};

const EMOJI_SENTIMENTS = {
    1: { emoji: "😡", label: "Frustrated / Strongly Disagree" },
    2: { emoji: "🙁", label: "Dissatisfied / Disagree" },
    3: { emoji: "😐", label: "Neutral / Okay" },
    4: { emoji: "🙂", label: "Satisfied / Agree" },
    5: { emoji: "🤩", label: "Thriving / Strongly Agree" },
};

/* Convert API question to display format with parsed rating style */
function normalizeTakeQuestion(question) {
    const { cleanText, ratingStyle } = parseRatingQuestion(
        question.question_text
    );

    return {
        ...question,
        question_text: cleanText,
        ratingStyle: ratingStyle || "stars",
    };
}

/* Keep questions in display order */
function sortQuestions(questions) {
    return [...questions].sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
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
    const { resolvedTheme, setTheme } = useTheme();

    const toggleTheme = () => {
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
    };

    // Stores whether this survey was completed in this browser
    const submittedStorageKey = `survey_submitted_${id}`;

    // Keep the same anonymous ID even after refresh
    const [submissionId] = useState(() => getSubmissionId(id));

    // Survey data
    const [survey, setSurvey] = useState(null);
    const [questions, setQuestions] = useState([]);

    // Employee answers
    const [answers, setAnswers] = useState({});

    // Star hover states per question
    const [hoverRating, setHoverRating] = useState({});

    // Page state
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [formError, setFormError] = useState("");

    // Submission state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(
        () => localStorage.getItem(submittedStorageKey) === "true"
    );

    /* Update normal answer */
    function handleAnswerChange(questionId, value) {
        setAnswers((previousAnswers) => ({
            ...previousAnswers,
            [questionId]:
                typeof value === "string"
                    ? removeLeadingWhitespace(value)
                    : value,
        }));
    }

    /* Update rating */
    function handleRatingChange(questionId, rating) {
        handleAnswerChange(questionId, String(rating));
    }

    /* Validate required questions */
    function validateSurvey() {
        for (const question of questions) {
            if (!question.is_required) {
                continue;
            }

            const answer = answers[question.id];

            const hasEmptyValue =
                answer === undefined ||
                answer === null ||
                (typeof answer === "string" && answer.trim() === "");

            const hasEmptySelection =
                Array.isArray(answer) && answer.length === 0;

            if (hasEmptyValue || hasEmptySelection) {
                setFormError(`Please answer: ${question.question_text}`);

                const targetEl = document.getElementById(
                    `take-question-${question.id}`
                );
                if (targetEl) {
                    targetEl.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }

                Swal.fire({
                    icon: "warning",
                    title: "Required Question Missing",
                    text: `Please answer required question: "${question.question_text}"`,
                    confirmButtonText: "Review Question",
                });

                return false;
            }
        }

        for (const question of questions) {
            if (!["text", "textarea"].includes(question.question_type)) {
                continue;
            }

            const answer = answers[question.id];

            if (
                typeof answer === "string" &&
                countWords(answer) > ANSWER_MAX_WORDS
            ) {
                setFormError(
                    `Answer is too long for: ${question.question_text}`
                );

                const targetEl = document.getElementById(
                    `take-question-${question.id}`
                );
                if (targetEl) {
                    targetEl.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }

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

        if (isSubmitting || submitted) {
            return;
        }

        if (!validateSurvey()) {
            return;
        }

        const confirmation = await Swal.fire({
            icon: "question",
            title: "Submit Anonymous Feedback?",
            text: "Your responses are strictly anonymous and cannot be edited after submission.",
            showCancelButton: true,
            confirmButtonText: "Submit Survey",
            cancelButtonText: "Review Answers",
        });

        if (!confirmation.isConfirmed) {
            return;
        }

        const payload = Object.entries(answers).map(
            ([questionId, answer]) => ({
                question_id: Number(questionId),
                answer,
            })
        );

        try {
            setIsSubmitting(true);

            await API.submitSurvey(id, submissionId, payload);

            localStorage.setItem(submittedStorageKey, "true");
            setSubmitted(true);
            setAnswers({});

            await Swal.fire({
                icon: "success",
                title: "Feedback Recorded",
                text: "Thank you for sharing your candid perspective. Your response is completely anonymous.",
                timer: 1800,
                showConfirmButton: false,
                timerProgressBar: true,
            });
        } catch (error) {
            console.error(error);

            if (error.status === 409) {
                localStorage.setItem(submittedStorageKey, "true");
                setSubmitted(true);

                await Swal.fire({
                    icon: "info",
                    title: "Already Submitted",
                    text: "This survey has already been submitted from this device.",
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

                const data = await API.getSurveyQuestions(id);

                if (!isMounted) return;

                setSurvey(data);
                const sorted = sortQuestions(data.questions || []);
                setQuestions(sorted.map(normalizeTakeQuestion));
            } catch (error) {
                console.error("Survey loading error:", error);
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

    /* Calculate live progress */
    const answeredCount = questions.filter((q) => {
        const val = answers[q.id];
        if (val === undefined || val === null) return false;
        if (typeof val === "string" && val.trim() === "") return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
    }).length;

    const progressPercentage =
        questions.length > 0
            ? Math.round((answeredCount / questions.length) * 100)
            : 0;

    /* Loading state */
    if (loading) {
        return (
            <div className="take-survey-state">
                <div className="survey-state-card">
                    <div className="survey-loader-orbit">
                        <div className="orbit-spinner"></div>
                        <FaShieldAlt className="orbit-icon" />
                    </div>
                    <h2>Decrypting Suggestion Box...</h2>
                    <p>Connecting to secure, anonymous channel.</p>
                </div>
            </div>
        );
    }

    /* Error state */
    if (loadError) {
        return (
            <div className="take-survey-state">
                <div className="survey-state-card error-card">
                    <div className="survey-state-icon">
                        <FaExclamationCircle />
                    </div>
                    <h2>Survey Unavailable</h2>
                    <p>{loadError}</p>
                </div>
            </div>
        );
    }

    /* Submitted state */
    if (submitted) {
        return (
            <div className="take-survey-state">
                <div className="survey-state-card success-card">
                    <div className="survey-success-icon-well">
                        <FaCheckCircle />
                    </div>
                    <h1>Thank You for Your Feedback</h1>
                    <p>
                        Your thoughts have been deposited into the confidential
                        suggestion box. No personal identifier has been attached.
                    </p>
                    <div className="submission-badge-pill">
                        <FaLock className="pill-lock-icon" />
                        <span>100% Anonymous & Secure</span>
                    </div>
                    <span className="survey-complete-note">
                        You may now safely close this window.
                    </span>
                </div>
            </div>
        );
    }

    return (
        <main className="take-survey-page">
            <div className="take-survey-container">
                {/* Top Quick Actions Bar (Dual Theme Switcher) */}
                <div className="take-survey-nav-strip">
                    <div className="nav-security-tag">
                        <FaShieldAlt className="tag-shield-icon" />
                        <span>Confidential Feedback Channel</span>
                    </div>

                    <button
                        type="button"
                        className="take-theme-toggle-btn"
                        onClick={toggleTheme}
                        title={
                            resolvedTheme === "dark"
                                ? "Switch to Light Mode"
                                : "Switch to Dark Mode"
                        }
                        aria-label="Toggle theme"
                    >
                        {resolvedTheme === "dark" ? (
                            <FaSun className="theme-toggle-icon sun" />
                        ) : (
                            <FaMoon className="theme-toggle-icon moon" />
                        )}
                        <span className="theme-toggle-label">
                            {resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}
                        </span>
                    </button>
                </div>

                {/* Survey Hero Card */}
                <header className="take-survey-header">
                    <div className="survey-header-badge">
                        <span className="active-glow-dot"></span>
                        <span>Digital Suggestion Box • Emotional Thermometer</span>
                    </div>

                    <h1>{survey?.title}</h1>

                    {survey?.description && (
                        <p className="survey-header-desc">{survey.description}</p>
                    )}

                    <div className="survey-header-security-pill">
                        <FaLock className="security-lock-icon" />
                        <span>
                            Your responses are strictly anonymous. No names, IP addresses,
                            or credentials are linked to your submission.
                        </span>
                    </div>

                    {/* Live Dynamic Progress Bar */}
                    <div className="survey-progress-card">
                        <div className="progress-info-row">
                            <span className="progress-label">Progress</span>
                            <span className="progress-numbers">
                                <strong>{answeredCount}</strong> of{" "}
                                {questions.length} answered ({progressPercentage}%)
                            </span>
                        </div>
                        <div
                            className="progress-track"
                            role="progressbar"
                            aria-valuenow={progressPercentage}
                            aria-valuemin="0"
                            aria-valuemax="100"
                        >
                            <div
                                className="progress-fill"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </header>

                {/* Form Error Banner */}
                {formError && (
                    <div className="survey-form-error" role="alert">
                        <FaExclamationCircle className="error-icon" />
                        <div>
                            <strong>Action Required:</strong>
                            <span>{formError}</span>
                        </div>
                    </div>
                )}

                {/* Question Cards Form */}
                {questions.length === 0 ? (
                    <div className="survey-empty-state">
                        <h2>No Questions Available</h2>
                        <p>This survey currently has no active questions.</p>
                    </div>
                ) : (
                    <form className="take-survey-form" onSubmit={handleSubmit}>
                        {questions.map((question, index) => {
                            const options = question.options || [];
                            const isAnswered =
                                answers[question.id] !== undefined &&
                                answers[question.id] !== null &&
                                String(answers[question.id]).trim() !== "";
                            const currentRating = Number(answers[question.id]) || 0;
                            const activeHover = hoverRating[question.id];

                            return (
                                <section
                                    key={question.id}
                                    id={`take-question-${question.id}`}
                                    className={`take-question-card ${
                                        isAnswered ? "question-answered" : ""
                                    }`}
                                >
                                    <div className="question-heading">
                                        <span className="question-index">
                                            #{index + 1}
                                        </span>

                                        <div className="question-heading-body">
                                            <h2>
                                                {question.question_text}
                                                {question.is_required && (
                                                    <span
                                                        className="required-pill-tag"
                                                        aria-label="required"
                                                    >
                                                        * Required
                                                    </span>
                                                )}
                                            </h2>

                                            <div className="question-type-badge-row">
                                                <span className="question-type-tag">
                                                    {question.question_type === "radio" && (
                                                        <FaRegDotCircle className="type-icon" />
                                                    )}
                                                    {question.question_type === "dropdown" && (
                                                        <FaListUl className="type-icon" />
                                                    )}
                                                    {question.question_type === "rating" && (
                                                        <FaStar className="type-icon rating-star" />
                                                    )}
                                                    {["text", "textarea"].includes(
                                                        question.question_type
                                                    ) && (
                                                        <FaAlignLeft className="type-icon" />
                                                    )}
                                                    <span>
                                                        {question.question_type === "radio"
                                                            ? "Multiple Choice"
                                                            : question.question_type === "dropdown"
                                                            ? "Dropdown Select"
                                                            : question.question_type === "rating"
                                                            ? `Rating (${
                                                                  question.ratingStyle ===
                                                                  "emojis"
                                                                      ? "😊 Emojis"
                                                                      : question.ratingStyle ===
                                                                        "numeric"
                                                                      ? "🔢 Numeric"
                                                                      : "⭐️ Stars"
                                                              })`
                                                            : question.question_type === "textarea"
                                                            ? "Paragraph Response"
                                                            : "Short Response"}
                                                    </span>
                                                </span>

                                                {isAnswered && (
                                                    <span className="answered-check-tag">
                                                        <FaCheck /> Answered
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="question-answer-zone">
                                        {/* Short Text */}
                                        {question.question_type === "text" && (
                                            <div className="input-with-counter">
                                                <input
                                                    className="survey-text-input"
                                                    type="text"
                                                    placeholder="Share your thoughts honestly..."
                                                    maxLength={ANSWER_MAX_LENGTH}
                                                    value={answers[question.id] || ""}
                                                    onChange={(event) =>
                                                        handleAnswerChange(
                                                            question.id,
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                                <div className="input-word-counter">
                                                    {countWords(
                                                        answers[question.id] || ""
                                                    )}{" "}
                                                    / {ANSWER_MAX_WORDS} words
                                                </div>
                                            </div>
                                        )}

                                        {/* Textarea */}
                                        {question.question_type === "textarea" && (
                                            <div className="input-with-counter">
                                                <textarea
                                                    className="survey-textarea"
                                                    rows="4"
                                                    placeholder="Type your detailed, confidential feedback..."
                                                    maxLength={ANSWER_MAX_LENGTH}
                                                    value={answers[question.id] || ""}
                                                    onChange={(event) =>
                                                        handleAnswerChange(
                                                            question.id,
                                                            event.target.value
                                                        )
                                                    }
                                                />
                                                <div className="input-word-counter">
                                                    {countWords(
                                                        answers[question.id] || ""
                                                    )}{" "}
                                                    / {ANSWER_MAX_WORDS} words
                                                </div>
                                            </div>
                                        )}

                                        {/* Rating Scale: Stars / Emojis / Numeric */}
                                        {question.question_type === "rating" && (
                                            <div className="survey-rating-container">
                                                {/* 1. Stars Mode */}
                                                {question.ratingStyle === "stars" && (
                                                    <div className="survey-stars-rating-wrapper">
                                                        <div
                                                            className="stars-cluster-bar"
                                                            onMouseLeave={() =>
                                                                setHoverRating(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        [question.id]: null,
                                                                    })
                                                                )
                                                            }
                                                        >
                                                            {[1, 2, 3, 4, 5].map(
                                                                (star) => {
                                                                    const activeLevel =
                                                                        activeHover !==
                                                                        null &&
                                                                        activeHover !==
                                                                        undefined
                                                                            ? activeHover
                                                                            : currentRating;
                                                                    const isLit =
                                                                        star <=
                                                                        activeLevel;

                                                                    return (
                                                                        <button
                                                                            key={star}
                                                                            type="button"
                                                                            className={`star-chip-btn ${
                                                                                isLit
                                                                                    ? "lit"
                                                                                    : ""
                                                                            } ${
                                                                                star ===
                                                                                currentRating
                                                                                    ? "current-pick"
                                                                                    : ""
                                                                            }`}
                                                                            onMouseEnter={() =>
                                                                                setHoverRating(
                                                                                    (prev) => ({
                                                                                        ...prev,
                                                                                        [question.id]: star,
                                                                                    })
                                                                                )
                                                                            }
                                                                            onClick={() =>
                                                                                handleRatingChange(
                                                                                    question.id,
                                                                                    star
                                                                                )
                                                                            }
                                                                            aria-label={`${star} Star`}
                                                                        >
                                                                            <FaStar className="star-svg-icon" />
                                                                        </button>
                                                                    );
                                                                }
                                                            )}
                                                        </div>

                                                        {answers[question.id] && (
                                                            <div className="rating-selection-feedback">
                                                                <span>Rating:</span>
                                                                <strong>
                                                                    ⭐️ {answers[question.id]} of 5 Stars —{" "}
                                                                    {
                                                                        RATING_SENTIMENTS[
                                                                            answers[
                                                                                question.id
                                                                            ]
                                                                        ]?.label
                                                                    }
                                                                </strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* 2. Mood Emojis Mode */}
                                                {question.ratingStyle === "emojis" && (
                                                    <div className="survey-emojis-rating-wrapper">
                                                        <div className="emojis-cluster-bar">
                                                            {[1, 2, 3, 4, 5].map(
                                                                (level) => {
                                                                    const isSelected =
                                                                        answers[
                                                                            question.id
                                                                        ] ===
                                                                        String(
                                                                            level
                                                                        );
                                                                    const info =
                                                                        EMOJI_SENTIMENTS[
                                                                            level
                                                                        ];

                                                                    return (
                                                                        <button
                                                                            key={level}
                                                                            type="button"
                                                                            className={`emoji-rate-btn ${
                                                                                isSelected
                                                                                    ? "selected"
                                                                                    : ""
                                                                            }`}
                                                                            onClick={() =>
                                                                                handleRatingChange(
                                                                                    question.id,
                                                                                    level
                                                                                )
                                                                            }
                                                                            aria-label={
                                                                                info.label
                                                                            }
                                                                        >
                                                                            <span className="emoji-face">
                                                                                {
                                                                                    info.emoji
                                                                                }
                                                                            </span>
                                                                            <span className="emoji-mood-tag">
                                                                                {
                                                                                    RATING_SENTIMENTS[
                                                                                        level
                                                                                    ]
                                                                                        .mood
                                                                                }
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                }
                                                            )}
                                                        </div>

                                                        {answers[question.id] && (
                                                            <div className="rating-selection-feedback">
                                                                <span>Sentiment:</span>
                                                                <strong>
                                                                    {
                                                                        EMOJI_SENTIMENTS[
                                                                            answers[
                                                                                question.id
                                                                            ]
                                                                        ]?.emoji
                                                                    }{" "}
                                                                    {
                                                                        EMOJI_SENTIMENTS[
                                                                            answers[
                                                                                question.id
                                                                            ]
                                                                        ]?.label
                                                                    }
                                                                </strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* 3. Numeric Chips Mode */}
                                                {question.ratingStyle === "numeric" && (
                                                    <div className="survey-numeric-rating-wrapper">
                                                        <div className="survey-rating">
                                                            {[1, 2, 3, 4, 5].map(
                                                                (rating) => {
                                                                    const isSelected =
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
                                                                            className={`rating-chip-button ${
                                                                                isSelected
                                                                                    ? "selected"
                                                                                    : ""
                                                                            }`}
                                                                            onClick={() =>
                                                                                handleRatingChange(
                                                                                    question.id,
                                                                                    rating
                                                                                )
                                                                            }
                                                                            aria-pressed={isSelected}
                                                                        >
                                                                            <span className="rating-number">
                                                                                {
                                                                                    rating
                                                                                }
                                                                            </span>
                                                                            <span className="rating-sentiment-hint">
                                                                                {
                                                                                    RATING_SENTIMENTS[
                                                                                        rating
                                                                                    ]
                                                                                        .mood
                                                                                }
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                }
                                                            )}
                                                        </div>

                                                        {answers[question.id] && (
                                                            <div className="rating-selection-feedback">
                                                                <span>Selected:</span>
                                                                <strong>
                                                                    {
                                                                        answers[
                                                                            question.id
                                                                        ]
                                                                    }{" "}
                                                                    —{" "}
                                                                    {
                                                                        RATING_SENTIMENTS[
                                                                            answers[
                                                                                question.id
                                                                            ]
                                                                        ]?.label
                                                                    }
                                                                </strong>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Choice Cards (Radio) */}
                                        {question.question_type === "radio" && (
                                            options.length > 0 ? (
                                                <div className="survey-options-grid">
                                                    {options.map((option) => {
                                                        const optionValue = String(
                                                            option.id
                                                        );
                                                        const isSelected =
                                                            answers[question.id] ===
                                                            optionValue;

                                                        return (
                                                            <label
                                                                key={option.id}
                                                                className={`survey-choice-card ${
                                                                    isSelected
                                                                        ? "selected"
                                                                        : ""
                                                                }`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${question.id}`}
                                                                    value={optionValue}
                                                                    checked={isSelected}
                                                                    onChange={(event) =>
                                                                        handleAnswerChange(
                                                                            question.id,
                                                                            event
                                                                                .target
                                                                                .value
                                                                        )
                                                                    }
                                                                    className="choice-hidden-radio"
                                                                />
                                                                <div className="choice-indicator-ring">
                                                                    {isSelected && (
                                                                        <div className="choice-indicator-dot" />
                                                                    )}
                                                                </div>
                                                                <span className="choice-text">
                                                                    {option.option_text}
                                                                </span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <p className="options-unavailable">
                                                    No options available for this question.
                                                </p>
                                            )
                                        )}

                                        {/* Dropdown Menu */}
                                        {question.question_type === "dropdown" && (
                                            options.length > 0 ? (
                                                <div className="survey-select-wrapper">
                                                    <select
                                                        className="survey-select"
                                                        value={
                                                            answers[question.id] || ""
                                                        }
                                                        onChange={(event) =>
                                                            handleAnswerChange(
                                                                question.id,
                                                                event.target.value
                                                            )
                                                        }
                                                    >
                                                        <option value="">
                                                            Select your choice...
                                                        </option>
                                                        {options.map((option) => (
                                                            <option
                                                                key={option.id}
                                                                value={String(
                                                                    option.id
                                                                )}
                                                            >
                                                                {option.option_text}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <p className="options-unavailable">
                                                    No options available for this question.
                                                </p>
                                            )
                                        )}
                                    </div>
                                </section>
                            );
                        })}

                        {/* Submission Area */}
                        <div className="survey-submit-area">
                            <div className="submit-disclaimer">
                                <FaShieldAlt className="disclaimer-shield" />
                                <div>
                                    <h4>Finalize Submission</h4>
                                    <p>
                                        Please confirm your answers above. Your response
                                        is strictly anonymous and will be immediately
                                        encrypted.
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="survey-submit-button"
                                disabled={isSubmitting}
                            >
                                <FaPaperPlane className="btn-icon" />
                                <span>
                                    {isSubmitting
                                        ? "Encrypting & Submitting..."
                                        : "Submit Anonymous Feedback"}
                                </span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </main>
    );
}

export default TakeSurvey;
