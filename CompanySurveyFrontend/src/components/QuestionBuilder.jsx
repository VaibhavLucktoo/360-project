import { useEffect, useState, useRef } from "react";
import {
    FaPen,
    FaTrashAlt,
    FaPlus,
    FaCheck,
    FaTimes,
    FaListUl,
    FaStar,
    FaAlignLeft,
    FaRegDotCircle,
} from "react-icons/fa";
import { removeLeadingWhitespace } from "../utils/inputWhitespace";
import {
    createQuestion,
    deleteQuestion,
    getAdminSurveyQuestions,
    updateQuestion,
} from "../services/api";
import {
    parseRatingQuestion,
    formatRatingQuestion,
} from "../utils/ratingStyles";

import "../styles/QuestionBuilder.css";

const QUESTION_TEXT_MAX_LENGTH = 2000;
const QUESTION_TEXT_MAX_WORDS = 60;
const OPTION_TEXT_MAX_LENGTH = 500;
const OPTION_TEXT_MAX_WORDS = 20;

/* Question types that support custom options */
const CHOICE_QUESTION_TYPES = ["radio", "dropdown"];

function isChoiceQuestionType(type) {
    return CHOICE_QUESTION_TYPES.includes(type);
}

function countWords(value) {
    return value.trim().split(/\s+/).filter(Boolean).length;
}

/* Helper to get friendly badge icon and label for each question type */
function getQuestionTypeBadge(question) {
    const type = question.type;
    const rStyle = question.ratingStyle || "stars";

    switch (type) {
        case "radio":
            return {
                label: "Multiple Choice",
                icon: <FaRegDotCircle className="type-badge-icon" />,
            };
        case "dropdown":
            return {
                label: "Dropdown Select",
                icon: <FaListUl className="type-badge-icon" />,
            };
        case "rating": {
            let styleTag = "⭐️ Stars";
            if (rStyle === "emojis") styleTag = "😊 Emojis";
            if (rStyle === "numeric") styleTag = "🔢 Numeric";
            return {
                label: `Rating (${styleTag})`,
                icon: <FaStar className="type-badge-icon type-rating-icon" />,
            };
        }
        case "textarea":
            return {
                label: "Long Textarea",
                icon: <FaAlignLeft className="type-badge-icon" />,
            };
        case "text":
        default:
            return {
                label: "Short Text",
                icon: <FaAlignLeft className="type-badge-icon" />,
            };
    }
}

/* Convert API question into UI format */
function normalizeQuestion(question) {
    const { cleanText, ratingStyle } = parseRatingQuestion(
        question.question_text
    );

    return {
        id: question.id,
        text: cleanText,
        ratingStyle: ratingStyle || "stars",
        type: question.question_type,
        required: question.is_required,
        display_order: question.display_order,
        survey_id: question.survey_id,
        options: Array.isArray(question.options)
            ? [...question.options]
                .sort(
                    (firstOption, secondOption) =>
                        (firstOption.display_order || 0) -
                        (secondOption.display_order || 0)
                )
                .map((option) => ({
                    id: option.id,
                    option_text: option.option_text,
                    display_order: option.display_order,
                }))
            : [],
    };
}

/* Keep questions in display order */
function sortQuestions(questions) {
    return [...questions].sort(
        (firstQuestion, secondQuestion) =>
            (firstQuestion.display_order || 0) -
            (secondQuestion.display_order || 0)
    );
}

function QuestionBuilder({ surveyId, onQuestionCountChange }) {
    /* ===========================================
       State
    =========================================== */
    const [questions, setQuestions] = useState([]);

    // Question form state (used for Add New or active Inline Edit)
    const [questionText, setQuestionText] = useState("");
    const [questionType, setQuestionType] = useState("text");
    const [ratingStyle, setRatingStyle] = useState("stars"); // "stars" | "emojis" | "numeric"
    const [required, setRequired] = useState(false);
    const [options, setOptions] = useState([]);

    // Which question is currently expanded for inline editing
    const [editingQuestionId, setEditingQuestionId] = useState(null);

    // Request states
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Messages
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    const topFormRef = useRef(null);

    /* ===========================================
       Load Existing Questions
    =========================================== */
    useEffect(() => {
        let isMounted = true;

        async function fetchQuestions() {
            if (!surveyId) return;

            try {
                setLoading(true);
                setError("");

                const payload = await getAdminSurveyQuestions(surveyId);
                const normalizedQuestions = Array.isArray(payload?.questions)
                    ? sortQuestions(payload.questions.map(normalizeQuestion))
                    : [];

                if (isMounted) {
                    setQuestions(normalizedQuestions);
                }
            } catch (fetchError) {
                if (isMounted) {
                    setError(fetchError.message || "Failed to load questions.");
                    setQuestions([]);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchQuestions();

        return () => {
            isMounted = false;
        };
    }, [surveyId]);

    /* ===========================================
       Report Question Count to Parent
    =========================================== */
    useEffect(() => {
        if (onQuestionCountChange) {
            onQuestionCountChange(questions.length);
        }
    }, [questions, onQuestionCountChange]);

    /* ===========================================
       Option Management
    =========================================== */
    function handleQuestionTypeChange(event) {
        const newType = event.target.value;
        setQuestionType(newType);

        if (isChoiceQuestionType(newType) && options.length === 0) {
            setOptions([
                { option_text: "" },
                { option_text: "" },
            ]);
        }
    }

    function handleAddOption() {
        setOptions((currentOptions) => [
            ...currentOptions,
            { option_text: "" },
        ]);
    }

    function handleOptionChange(index, value) {
        setOptions((currentOptions) =>
            currentOptions.map((opt, optIndex) => {
                if (optIndex !== index) return opt;
                return {
                    ...opt,
                    option_text: removeLeadingWhitespace(value),
                };
            })
        );
    }

    function handleRemoveOption(index) {
        setOptions((currentOptions) =>
            currentOptions.filter((_, optIndex) => optIndex !== index)
        );
    }

    function resetQuestionForm() {
        setQuestionText("");
        setQuestionType("text");
        setRatingStyle("stars");
        setRequired(false);
        setOptions([]);
        setEditingQuestionId(null);
    }

    /* ===========================================
       Validation
    =========================================== */
    function validateOptions() {
        if (!isChoiceQuestionType(questionType)) {
            return true;
        }

        if (options.length < 2) {
            setError("Add at least two options for choice questions.");
            return false;
        }

        const cleanedOptions = options.map((option) =>
            option.option_text.trim()
        );

        if (cleanedOptions.some((option) => !option)) {
            setError("Fill in every option or remove the empty option.");
            return false;
        }

        if (
            cleanedOptions.some(
                (option) => countWords(option) > OPTION_TEXT_MAX_WORDS
            )
        ) {
            setError(`Each option must be ${OPTION_TEXT_MAX_WORDS} words or fewer.`);
            return false;
        }

        const lowercaseOptions = cleanedOptions.map((option) =>
            option.toLowerCase()
        );

        if (new Set(lowercaseOptions).size !== lowercaseOptions.length) {
            setError("Duplicate options are not allowed.");
            return false;
        }

        return true;
    }

    function prepareOptions() {
        return options.map((option, index) => {
            const preparedOption = {
                option_text: option.option_text.trim(),
                display_order: index + 1,
            };

            if (option.id) {
                preparedOption.id = option.id;
            }

            return preparedOption;
        });
    }

    /* ===========================================
       Save (Create or Update)
    =========================================== */
    async function handleSaveQuestion(event) {
        event.preventDefault();

        if (!surveyId) {
            setError("Save the survey before adding questions.");
            return;
        }

        if (!questionText.trim()) {
            setError("Question text cannot be empty.");
            return;
        }

        if (countWords(questionText) > QUESTION_TEXT_MAX_WORDS) {
            setError(`Question cannot exceed ${QUESTION_TEXT_MAX_WORDS} words.`);
            return;
        }

        if (!validateOptions()) {
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccessMessage("");

            const formattedText =
                questionType === "rating"
                    ? formatRatingQuestion(questionText, ratingStyle)
                    : questionText.trim();

            const baseQuestionPayload = {
                survey_id: surveyId,
                question_text: formattedText,
                question_type: questionType,
                is_required: required,
            };

            if (isChoiceQuestionType(questionType)) {
                baseQuestionPayload.options = prepareOptions();
            }

            const maxOrder = questions.reduce(
                (max, q) => Math.max(max, q.display_order || 0),
                0
            );
            const nextDisplayOrder = maxOrder + 1;

            if (editingQuestionId) {
                /* Inline Update */
                const existingQuestion = questions.find(
                    (q) => q.id === editingQuestionId
                );

                const payload = await updateQuestion(editingQuestionId, {
                    ...baseQuestionPayload,
                    display_order:
                        existingQuestion?.display_order || nextDisplayOrder,
                });

                setQuestions((currentQuestions) =>
                    sortQuestions(
                        currentQuestions.map((q) =>
                            q.id === editingQuestionId
                                ? normalizeQuestion(payload)
                                : q
                        )
                    )
                );

                setSuccessMessage("Question updated successfully.");
            } else {
                /* Create Question from top form */
                const payload = await createQuestion({
                    ...baseQuestionPayload,
                    display_order: nextDisplayOrder,
                });

                setQuestions((currentQuestions) =>
                    sortQuestions([
                        ...currentQuestions,
                        normalizeQuestion(payload),
                    ])
                );

                setSuccessMessage("Question added to survey successfully.");
            }

            resetQuestionForm();
        } catch (saveError) {
            setError(saveError.message || "Failed to save question.");
        } finally {
            setSaving(false);
        }
    }

    /* ===========================================
       Trigger Inline Edit
    =========================================== */
    function handleEditQuestion(question) {
        setEditingQuestionId(question.id);
        setQuestionText(question.text || "");
        setQuestionType(question.type || "text");
        setRatingStyle(question.ratingStyle || "stars");
        setRequired(Boolean(question.required));
        setOptions(
            Array.isArray(question.options)
                ? question.options.map((option) => ({ ...option }))
                : []
        );

        setError("");
        setSuccessMessage("");

        // Gently ensure the card is comfortably in view without jumping to top
        setTimeout(() => {
            const cardEl = document.getElementById(`question-card-${question.id}`);
            if (cardEl) {
                cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
            const inputEl = document.getElementById(
                `inline-question-text-${question.id}`
            );
            if (inputEl) {
                inputEl.focus({ preventScroll: true });
                inputEl.select();
            }
        }, 100);
    }

    function handleCancelEdit() {
        resetQuestionForm();
        setError("");
    }

    /* ===========================================
       Delete Question
    =========================================== */
    async function handleDeleteQuestion(questionId) {
        if (!window.confirm("Are you sure you want to delete this question?")) {
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccessMessage("");

            if (editingQuestionId === questionId) {
                resetQuestionForm();
            }

            await deleteQuestion(questionId);

            setQuestions((currentQuestions) =>
                currentQuestions.filter((q) => q.id !== questionId)
            );

            setSuccessMessage("Question removed successfully.");
        } catch (deleteError) {
            setError(deleteError.message || "Failed to delete question.");
        } finally {
            setSaving(false);
        }
    }

    /* Helper to render Rating Style Selector & Live Preview */
    function renderRatingStyleSelector() {
        return (
            <div className="rating-style-selector-panel">
                <div className="rating-style-header">
                    <label>Rating Display Style for Respondents</label>
                    <span className="rating-style-subhint">
                        Choose how employees interact with this rating question
                    </span>
                </div>

                <div className="rating-style-options">
                    <button
                        type="button"
                        className={`rating-style-btn ${
                            ratingStyle === "stars" ? "active" : ""
                        }`}
                        onClick={() => setRatingStyle("stars")}
                        disabled={saving}
                    >
                        <span className="style-btn-icon">⭐️</span>
                        <div className="style-btn-info">
                            <span className="style-btn-title">5-Star Scale</span>
                            <span className="style-btn-desc">Hover & glowing stars</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        className={`rating-style-btn ${
                            ratingStyle === "emojis" ? "active" : ""
                        }`}
                        onClick={() => setRatingStyle("emojis")}
                        disabled={saving}
                    >
                        <span className="style-btn-icon">😊</span>
                        <div className="style-btn-info">
                            <span className="style-btn-title">Mood Emojis</span>
                            <span className="style-btn-desc">5 sentiment faces</span>
                        </div>
                    </button>

                    <button
                        type="button"
                        className={`rating-style-btn ${
                            ratingStyle === "numeric" ? "active" : ""
                        }`}
                        onClick={() => setRatingStyle("numeric")}
                        disabled={saving}
                    >
                        <span className="style-btn-icon">🔢</span>
                        <div className="style-btn-info">
                            <span className="style-btn-title">Numeric Chips</span>
                            <span className="style-btn-desc">1 to 5 score tiles</span>
                        </div>
                    </button>
                </div>

                {/* Live Respondent Preview Box */}
                <div className="rating-live-preview-box">
                    <div className="preview-box-badge">
                        <span>Interactive Respondent Preview:</span>
                    </div>

                    {ratingStyle === "stars" && (
                        <div className="preview-stars-display">
                            <div className="preview-stars-cluster">
                                <span className="preview-star glow">★</span>
                                <span className="preview-star glow">★</span>
                                <span className="preview-star glow">★</span>
                                <span className="preview-star glow">★</span>
                                <span className="preview-star muted">★</span>
                            </div>
                            <span className="preview-feedback-pill">
                                ⭐️⭐️⭐️⭐️ 4 of 5 Stars — High / Agree
                            </span>
                        </div>
                    )}

                    {ratingStyle === "emojis" && (
                        <div className="preview-emojis-display">
                            <div className="preview-emojis-cluster">
                                <span className="preview-emoji">😡</span>
                                <span className="preview-emoji">🙁</span>
                                <span className="preview-emoji">😐</span>
                                <span className="preview-emoji active-glow">🙂</span>
                                <span className="preview-emoji">🤩</span>
                            </div>
                            <span className="preview-feedback-pill">
                                Selected: 🙂 Satisfied / Agree
                            </span>
                        </div>
                    )}

                    {ratingStyle === "numeric" && (
                        <div className="preview-numeric-display">
                            <div className="preview-numeric-cluster">
                                <span className="preview-chip">1</span>
                                <span className="preview-chip">2</span>
                                <span className="preview-chip">3</span>
                                <span className="preview-chip active-chip">4</span>
                                <span className="preview-chip">5</span>
                            </div>
                            <span className="preview-feedback-pill">
                                Selected: 4 — Agree
                            </span>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <section className="question-builder">
            {/* Header info bar */}
            <div className="question-builder-header">
                <div>
                    <h2>Survey Questions</h2>
                    <p>
                        Design questions that spark candid, constructive feedback.
                    </p>
                </div>
                <div className="question-count-badge">
                    <span>{questions.length}</span>
                    <span>{questions.length === 1 ? "Question" : "Questions"}</span>
                </div>
            </div>

            {/* Global Notifications */}
            {error && !editingQuestionId && (
                <div className="question-builder-error" role="alert">
                    <span>⚠️ {error}</span>
                    <button
                        type="button"
                        onClick={() => setError("")}
                        className="dismiss-alert-btn"
                        aria-label="Dismiss error"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {successMessage && (
                <div className="question-builder-success" role="alert">
                    <span>✓ {successMessage}</span>
                    <button
                        type="button"
                        onClick={() => setSuccessMessage("")}
                        className="dismiss-alert-btn"
                        aria-label="Dismiss success message"
                    >
                        <FaTimes />
                    </button>
                </div>
            )}

            {/* ========================================================
               Top Creator: Add New Question (only active when not editing)
               ======================================================== */}
            {surveyId && (
                <div
                    ref={topFormRef}
                    className={`question-create-card ${
                        editingQuestionId ? "creator-muted" : ""
                    }`}
                >
                    {editingQuestionId ? (
                        <div className="creator-dimmed-notice">
                            <div className="dimmed-notice-left">
                                <span className="active-pulse-beacon"></span>
                                <div>
                                    <strong>Editing Question In-Place</strong>
                                    <p>
                                        Scroll down to the highlighted card to
                                        update or cancel changes.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                className="creator-resume-btn"
                                onClick={handleCancelEdit}
                            >
                                Cancel Edit & Add New
                            </button>
                        </div>
                    ) : (
                        <form
                            className="create-question-form"
                            onSubmit={handleSaveQuestion}
                        >
                            <div className="create-form-header">
                                <div className="create-header-title">
                                    <span className="create-icon-well">
                                        <FaPlus />
                                    </span>
                                    <div>
                                        <h3>Add a New Question</h3>
                                        <p>
                                            Select a format and phrase your question clearly.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Question text field */}
                            <div className="form-group">
                                <div className="form-label-row">
                                    <label htmlFor="create-question-text">
                                        Question Prompt
                                    </label>
                                    <span
                                        className={`word-counter ${
                                            countWords(questionText) >
                                            QUESTION_TEXT_MAX_WORDS
                                                ? "word-counter-overflow"
                                                : ""
                                        }`}
                                    >
                                        {countWords(questionText)} /{" "}
                                        {QUESTION_TEXT_MAX_WORDS} words
                                    </span>
                                </div>
                                <input
                                    id="create-question-text"
                                    type="text"
                                    className="form-control-input"
                                    value={questionText}
                                    placeholder="e.g., How would you rate psychological safety on our team?"
                                    maxLength={QUESTION_TEXT_MAX_LENGTH}
                                    onChange={(event) =>
                                        setQuestionText(
                                            removeLeadingWhitespace(
                                                event.target.value
                                            )
                                        )
                                    }
                                    disabled={saving}
                                />
                            </div>

                            {/* Type and Required row */}
                            <div className="form-row-duo">
                                <div className="form-group flex-1">
                                    <label htmlFor="create-question-type">
                                        Question Format
                                    </label>
                                    <div className="select-wrapper">
                                        <select
                                            id="create-question-type"
                                            className="form-control-select"
                                            value={questionType}
                                            onChange={handleQuestionTypeChange}
                                            disabled={saving}
                                        >
                                            <option value="text">
                                                Short Text Response
                                            </option>
                                            <option value="textarea">
                                                Long Text Response
                                            </option>
                                            <option value="radio">
                                                Multiple Choice (Single Option)
                                            </option>
                                            <option value="rating">
                                                1 - 5 Rating Scale
                                            </option>
                                            <option value="dropdown">
                                                Dropdown Menu
                                            </option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group toggle-group">
                                    <label className="toggle-switch-container">
                                        <input
                                            type="checkbox"
                                            className="toggle-checkbox"
                                            checked={required}
                                            onChange={(event) =>
                                                setRequired(
                                                    event.target.checked
                                                )
                                            }
                                            disabled={saving}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span className="toggle-text">
                                            Required question
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Rating Style Selector (if rating) */}
                            {questionType === "rating" && renderRatingStyleSelector()}

                            {/* Options if choice */}
                            {isChoiceQuestionType(questionType) && (
                                <div className="options-builder-panel">
                                    <div className="options-builder-header">
                                        <h4>Answer Choices</h4>
                                        <button
                                            type="button"
                                            className="btn-add-option"
                                            onClick={handleAddOption}
                                            disabled={saving}
                                        >
                                            <FaPlus className="icon-xs" />
                                            <span>Add Choice</span>
                                        </button>
                                    </div>

                                    <div className="options-input-list">
                                        {options.map((option, index) => (
                                            <div
                                                key={index}
                                                className="option-input-row"
                                            >
                                                <span className="option-row-number">
                                                    {index + 1}
                                                </span>
                                                <input
                                                    type="text"
                                                    className="form-control-input option-field"
                                                    value={option.option_text}
                                                    placeholder={`Choice #${
                                                        index + 1
                                                    }`}
                                                    maxLength={
                                                        OPTION_TEXT_MAX_LENGTH
                                                    }
                                                    onChange={(event) =>
                                                        handleOptionChange(
                                                            index,
                                                            event.target.value
                                                        )
                                                    }
                                                    disabled={saving}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn-remove-option"
                                                    onClick={() =>
                                                        handleRemoveOption(index)
                                                    }
                                                    disabled={
                                                        saving ||
                                                        options.length <= 2
                                                    }
                                                    title={
                                                        options.length <= 2
                                                            ? "At least 2 choices required"
                                                            : "Remove choice"
                                                    }
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Submit button */}
                            <div className="create-form-actions">
                                <button
                                    type="submit"
                                    className="btn-add-question"
                                    disabled={saving}
                                >
                                    <FaPlus className="icon-sm" />
                                    <span>
                                        {saving
                                            ? "Saving Question..."
                                            : "Add Question to Survey"}
                                    </span>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}

            {/* ========================================================
               Question List with In-Place Inline Editor
               ======================================================== */}
            <div className="question-list-container">
                <div className="list-subheader">
                    <h3>Survey Flow ({questions.length})</h3>
                    {questions.length > 0 && (
                        <span className="list-hint">
                            Click <strong>Edit</strong> on any card to modify it in-place
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="question-loading-skeleton">
                        <div className="skeleton-bar"></div>
                        <div className="skeleton-bar short"></div>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="question-empty-slate">
                        <div className="empty-icon-ring">
                            <FaAlignLeft />
                        </div>
                        <h3>No questions drafted yet</h3>
                        <p>
                            Use the builder above to craft your first suggestion box
                            question.
                        </p>
                    </div>
                ) : (
                    <div className="questions-stream">
                        {questions.map((question, index) => {
                            const isEditing = editingQuestionId === question.id;
                            const badgeInfo = getQuestionTypeBadge(question);

                            return (
                                <div
                                    key={question.id}
                                    id={`question-card-${question.id}`}
                                    className={`question-stream-card ${
                                        isEditing ? "card-inline-editing" : ""
                                    }`}
                                >
                                    {isEditing ? (
                                        /* =====================================
                                           IN-PLACE INLINE EDITOR FORM
                                           ===================================== */
                                        <form
                                            className="inline-editor-form"
                                            onSubmit={handleSaveQuestion}
                                        >
                                            <div className="inline-editor-top">
                                                <div className="inline-title-badge">
                                                    <span className="pulse-indicator"></span>
                                                    <span>
                                                        Editing Question #{index + 1}
                                                    </span>
                                                </div>
                                                <button
                                                    type="button"
                                                    className="inline-dismiss-btn"
                                                    onClick={handleCancelEdit}
                                                    title="Cancel editing"
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>

                                            {/* Question Prompt Field */}
                                            <div className="form-group">
                                                <div className="form-label-row">
                                                    <label
                                                        htmlFor={`inline-question-text-${question.id}`}
                                                    >
                                                        Question Text
                                                    </label>
                                                    <span
                                                        className={`word-counter ${
                                                            countWords(
                                                                questionText
                                                            ) >
                                                            QUESTION_TEXT_MAX_WORDS
                                                                ? "word-counter-overflow"
                                                                : ""
                                                        }`}
                                                    >
                                                        {countWords(questionText)}{" "}
                                                        / {QUESTION_TEXT_MAX_WORDS}{" "}
                                                        words
                                                    </span>
                                                </div>
                                                <input
                                                    id={`inline-question-text-${question.id}`}
                                                    type="text"
                                                    className="form-control-input inline-text-input"
                                                    value={questionText}
                                                    placeholder="Enter updated question text..."
                                                    maxLength={
                                                        QUESTION_TEXT_MAX_LENGTH
                                                    }
                                                    onChange={(event) =>
                                                        setQuestionText(
                                                            removeLeadingWhitespace(
                                                                event.target
                                                                    .value
                                                            )
                                                        )
                                                    }
                                                    disabled={saving}
                                                />
                                            </div>

                                            {/* Type and Required Row */}
                                            <div className="form-row-duo">
                                                <div className="form-group flex-1">
                                                    <label
                                                        htmlFor={`inline-question-type-${question.id}`}
                                                    >
                                                        Question Format
                                                    </label>
                                                    <div className="select-wrapper">
                                                        <select
                                                            id={`inline-question-type-${question.id}`}
                                                            className="form-control-select"
                                                            value={questionType}
                                                            onChange={
                                                                handleQuestionTypeChange
                                                            }
                                                            disabled={saving}
                                                        >
                                                            <option value="text">
                                                                Short Text Response
                                                            </option>
                                                            <option value="textarea">
                                                                Long Text Response
                                                            </option>
                                                            <option value="radio">
                                                                Multiple Choice (Single Option)
                                                            </option>
                                                            <option value="rating">
                                                                1 - 5 Rating Scale
                                                            </option>
                                                            <option value="dropdown">
                                                                Dropdown Menu
                                                            </option>
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="form-group toggle-group">
                                                    <label className="toggle-switch-container">
                                                        <input
                                                            type="checkbox"
                                                            className="toggle-checkbox"
                                                            checked={required}
                                                            onChange={(event) =>
                                                                setRequired(
                                                                    event.target
                                                                        .checked
                                                                )
                                                            }
                                                            disabled={saving}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                        <span className="toggle-text">
                                                            Required
                                                        </span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Rating Style Selector (if rating) */}
                                            {questionType === "rating" &&
                                                renderRatingStyleSelector()}

                                            {/* Choice Options editor if choice */}
                                            {isChoiceQuestionType(
                                                questionType
                                            ) && (
                                                <div className="options-builder-panel inline-options">
                                                    <div className="options-builder-header">
                                                        <h4>Answer Options</h4>
                                                        <button
                                                            type="button"
                                                            className="btn-add-option"
                                                            onClick={
                                                                handleAddOption
                                                            }
                                                            disabled={saving}
                                                        >
                                                            <FaPlus className="icon-xs" />
                                                            <span>Add Option</span>
                                                        </button>
                                                    </div>

                                                    <div className="options-input-list">
                                                        {options.map(
                                                            (opt, optIdx) => (
                                                                <div
                                                                    key={optIdx}
                                                                    className="option-input-row"
                                                                >
                                                                    <span className="option-row-number">
                                                                        {optIdx +
                                                                            1}
                                                                    </span>
                                                                    <input
                                                                        type="text"
                                                                        className="form-control-input option-field"
                                                                        value={
                                                                            opt.option_text
                                                                        }
                                                                        placeholder={`Option ${
                                                                            optIdx +
                                                                            1
                                                                        }`}
                                                                        maxLength={
                                                                            OPTION_TEXT_MAX_LENGTH
                                                                        }
                                                                        onChange={(
                                                                            e
                                                                        ) =>
                                                                            handleOptionChange(
                                                                                optIdx,
                                                                                e
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            saving
                                                                        }
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        className="btn-remove-option"
                                                                        onClick={() =>
                                                                            handleRemoveOption(
                                                                                optIdx
                                                                            )
                                                                        }
                                                                        disabled={
                                                                            saving ||
                                                                            options.length <=
                                                                                2
                                                                        }
                                                                        title={
                                                                            options.length <=
                                                                            2
                                                                                ? "At least 2 choices required"
                                                                                : "Remove choice"
                                                                        }
                                                                    >
                                                                        <FaTimes />
                                                                    </button>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Inline error if present */}
                                            {error && isEditing && (
                                                <div className="inline-error-banner">
                                                    ⚠️ {error}
                                                </div>
                                            )}

                                            {/* Inline action buttons */}
                                            <div className="inline-form-footer">
                                                <button
                                                    type="button"
                                                    className="btn-inline-cancel"
                                                    onClick={handleCancelEdit}
                                                    disabled={saving}
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="btn-inline-save"
                                                    disabled={saving}
                                                >
                                                    <FaCheck className="icon-sm" />
                                                    <span>
                                                        {saving
                                                            ? "Saving Changes..."
                                                            : "Update Question"}
                                                    </span>
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        /* =====================================
                                           RESTING CARD DISPLAY
                                           ===================================== */
                                        <div className="resting-card-layout">
                                            <div className="resting-card-left">
                                                <div className="resting-number-pill">
                                                    #{index + 1}
                                                </div>
                                                <div className="resting-content">
                                                    <h3 className="resting-question-title">
                                                        {question.text}
                                                    </h3>

                                                    <div className="resting-meta-row">
                                                        <span className="type-badge">
                                                            {badgeInfo.icon}
                                                            <span>
                                                                {badgeInfo.label}
                                                            </span>
                                                        </span>

                                                        {question.required ? (
                                                            <span className="required-badge">
                                                                Required
                                                            </span>
                                                        ) : (
                                                            <span className="optional-badge">
                                                                Optional
                                                            </span>
                                                        )}
                                                    </div>

                                                    {/* Choices preview chips */}
                                                    {question.options?.length >
                                                        0 && (
                                                        <div className="options-chip-cluster">
                                                            {question.options.map(
                                                                (opt, optIdx) => (
                                                                    <span
                                                                        key={
                                                                            opt.id ||
                                                                            optIdx
                                                                        }
                                                                        className="choice-chip"
                                                                    >
                                                                        <span className="chip-bullet">
                                                                            •
                                                                        </span>
                                                                        {
                                                                            opt.option_text
                                                                        }
                                                                    </span>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="resting-card-actions">
                                                <button
                                                    type="button"
                                                    className="action-pill-btn edit-pill-btn"
                                                    onClick={() =>
                                                        handleEditQuestion(
                                                            question
                                                        )
                                                    }
                                                    disabled={saving}
                                                    title="Edit question in-place"
                                                >
                                                    <FaPen className="pill-icon" />
                                                    <span>Edit</span>
                                                </button>

                                                <button
                                                    type="button"
                                                    className="action-pill-btn delete-pill-btn"
                                                    onClick={() =>
                                                        handleDeleteQuestion(
                                                            question.id
                                                        )
                                                    }
                                                    disabled={saving}
                                                    title="Delete question"
                                                >
                                                    <FaTrashAlt className="pill-icon" />
                                                    <span>Delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </section>
    );
}

export default QuestionBuilder;
