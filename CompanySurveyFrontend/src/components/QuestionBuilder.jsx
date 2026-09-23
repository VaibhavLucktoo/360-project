import { removeLeadingWhitespace } from "../utils/inputWhitespace";
import { useEffect, useState } from "react";

import {
    createQuestion,
    deleteQuestion,
    getAdminSurveyQuestions,
    updateQuestion,
} from "../services/api";

import "../styles/QuestionBuilder.css";

const QUESTION_TEXT_MAX_LENGTH = 2000;
const QUESTION_TEXT_MAX_WORDS = 60;
const OPTION_TEXT_MAX_LENGTH = 500;
const OPTION_TEXT_MAX_WORDS = 20;


/* Question types that support custom options */
const CHOICE_QUESTION_TYPES = [
    "radio",
    "dropdown",
    // "checkbox", // Reserved for future multi-select support.
];


function isChoiceQuestionType(type) {
    return CHOICE_QUESTION_TYPES.includes(type);
}


function countWords(value) {
    return value.trim().split(/\s+/).filter(Boolean).length;
}


/* Convert API question into UI format */
function normalizeQuestion(question) {

    return {
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        required: question.is_required,
        display_order: question.display_order,
        survey_id: question.survey_id,

        // Preserve saved option IDs for future editing.
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


function QuestionBuilder({
    surveyId,
    onQuestionCountChange,
}) {

    /* ===========================================
       Question List
    =========================================== */

    const [questions, setQuestions] = useState([]);


    /* ===========================================
       Question Form
    =========================================== */

    const [questionText, setQuestionText] =
        useState("");

    const [questionType, setQuestionType] =
        useState("text");

    const [required, setRequired] =
        useState(false);


    // Options for Radio and Dropdown. Checkbox is reserved for future use.
    const [options, setOptions] =
        useState([]);


    /* ===========================================
       Editing State
    =========================================== */

    const [
        editingQuestionId,
        setEditingQuestionId,
    ] = useState(null);


    /* ===========================================
       Request States
    =========================================== */

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);


    /* ===========================================
       Messages
    =========================================== */

    const [error, setError] =
        useState("");

    const [
        successMessage,
        setSuccessMessage,
    ] = useState("");


    /* ===========================================
       Load Existing Questions
    =========================================== */

    useEffect(() => {

        let isMounted = true;


        async function fetchQuestions() {

            if (!surveyId) {
                return;
            }


            try {

                setLoading(true);

                setError("");


                const payload =
                    await getAdminSurveyQuestions(
                        surveyId
                    );


                const normalizedQuestions =
                    Array.isArray(
                        payload?.questions
                    )
                        ? sortQuestions(
                            payload.questions.map(
                                normalizeQuestion
                            )
                        )
                        : [];


                if (isMounted) {

                    setQuestions(
                        normalizedQuestions
                    );

                }


            } catch (fetchError) {

                if (isMounted) {

                    setError(
                        fetchError.message ||
                        "Failed to load questions."
                    );

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
       Report Question Count
    =========================================== */

    useEffect(() => {

        if (onQuestionCountChange) {

            onQuestionCountChange(
                questions.length
            );

        }

    }, [
        questions,
        onQuestionCountChange,
    ]);


    /* ===========================================
       Question Type Change
    =========================================== */

    function handleQuestionTypeChange(
        event
    ) {

        const newType =
            event.target.value;


        setQuestionType(newType);


        // Start choice questions with two option fields.
        if (
            isChoiceQuestionType(newType) &&
            options.length === 0
        ) {

            setOptions([
                {
                    option_text: "",
                },
                {
                    option_text: "",
                },
            ]);

        }

    }


    /* ===========================================
       Add Option
    =========================================== */

    function handleAddOption() {

        setOptions(
            (currentOptions) => [
                ...currentOptions,
                {
                    option_text: "",
                },
            ]
        );

    }


    /* ===========================================
       Change Option
    =========================================== */

    function handleOptionChange(
        index,
        value
    ) {

        setOptions(
            (currentOptions) =>
                currentOptions.map(
                    (
                        option,
                        optionIndex
                    ) => {

                        if (
                            optionIndex !==
                            index
                        ) {
                            return option;
                        }


                        return {
                            ...option,

                            option_text:
                                removeLeadingWhitespace(value),
                        };

                    }
                )
        );

    }


    /* ===========================================
       Remove Option
    =========================================== */

    function handleRemoveOption(
        index
    ) {

        setOptions(
            (currentOptions) =>
                currentOptions.filter(
                    (
                        _,
                        optionIndex
                    ) =>
                        optionIndex !==
                        index
                )
        );

    }


    /* ===========================================
       Reset Question Form
    =========================================== */

    function resetQuestionForm() {

        setQuestionText("");

        setQuestionType("text");

        setRequired(false);

        setOptions([]);

        setEditingQuestionId(null);

    }


    /* ===========================================
       Validate Choice Options
    =========================================== */

    function validateOptions() {

        if (
            !isChoiceQuestionType(
                questionType
            )
        ) {

            return true;

        }


        // Radio/Dropdown need at least two options.
        if (options.length < 2) {

            setError(
                "Add at least two options."
            );

            return false;

        }


        const cleanedOptions =
            options.map(
                (option) =>
                    option.option_text.trim()
            );


        // Do not allow empty option fields.
        if (
            cleanedOptions.some(
                (option) =>
                    !option
            )
        ) {

            setError(
                "Fill in every option or remove the empty option."
            );

            return false;

        }

        if (
            cleanedOptions.some(
                (option) =>
                    countWords(option) >
                    OPTION_TEXT_MAX_WORDS
            )
        ) {

            setError(
                `Each option must be ${OPTION_TEXT_MAX_WORDS} words or fewer.`
            );

            return false;

        }


        const lowercaseOptions =
            cleanedOptions.map(
                (option) =>
                    option.toLowerCase()
            );


        // Prevent duplicate choices.
        if (
            new Set(
                lowercaseOptions
            ).size !==
            lowercaseOptions.length
        ) {

            setError(
                "Duplicate options are not allowed."
            );

            return false;

        }


        return true;

    }


    /* ===========================================
       Prepare Options For API
    =========================================== */

    function prepareOptions() {

        return options.map(
            (option, index) => {

                const preparedOption = {

                    option_text:
                        option.option_text.trim(),

                    display_order:
                        index + 1,

                };


                // Existing options keep their database IDs.
                if (option.id) {

                    preparedOption.id =
                        option.id;

                }


                return preparedOption;

            }
        );

    }


    /* ===========================================
       Add Or Update Question
    =========================================== */

    async function handleSaveQuestion(
        event
    ) {

        event.preventDefault();


        if (!surveyId) {

            setError(
                "Save the survey before adding questions."
            );

            return;

        }


        if (!questionText.trim()) {

            setError(
                "Question cannot be empty."
            );

            return;

        }

        if (
            countWords(questionText) >
            QUESTION_TEXT_MAX_WORDS
        ) {

            setError(
                `Question cannot exceed ${QUESTION_TEXT_MAX_WORDS} words.`
            );

            return;

        }


        if (!validateOptions()) {

            return;

        }


        try {

            setSaving(true);

            setError("");

            setSuccessMessage("");


            const baseQuestionPayload = {

                survey_id:
                    surveyId,

                question_text:
                    questionText.trim(),

                question_type:
                    questionType,

                is_required:
                    required,

            };


            // Only choice questions send option records.
            if (
                isChoiceQuestionType(
                    questionType
                )
            ) {

                baseQuestionPayload.options =
                    prepareOptions();

            }


            /* ===================================
               Update Question
            =================================== */

            if (editingQuestionId) {

                const existingQuestion =
                    questions.find(
                        (question) =>
                            question.id ===
                            editingQuestionId
                    );


                const payload =
                    await updateQuestion(
                        editingQuestionId,
                        {

                            ...baseQuestionPayload,

                            display_order:
                                existingQuestion
                                    ?.display_order ||
                                questions.length +
                                    1,

                        }
                    );


                setQuestions(
                    (
                        currentQuestions
                    ) =>
                        sortQuestions(
                            currentQuestions.map(
                                (
                                    question
                                ) =>
                                    question.id ===
                                    editingQuestionId
                                        ? normalizeQuestion(
                                            payload
                                        )
                                        : question
                            )
                        )
                );


                setSuccessMessage(
                    "Question updated successfully."
                );


            } else {

                /* ===================================
                   Create Question
                =================================== */

                const payload =
                    await createQuestion({

                        ...baseQuestionPayload,

                        display_order:
                            questions.length +
                            1,

                    });


                setQuestions(
                    (
                        currentQuestions
                    ) =>
                        sortQuestions([
                            ...currentQuestions,

                            normalizeQuestion(
                                payload
                            ),
                        ])
                );


                setSuccessMessage(
                    "Question added successfully."
                );

            }


            resetQuestionForm();


        } catch (saveError) {

            setError(
                saveError.message ||
                "Failed to save question."
            );


        } finally {

            setSaving(false);

        }

    }


    /* ===========================================
       Load Question Into Edit Form
    =========================================== */

    function handleEditQuestion(
        question
    ) {

        setEditingQuestionId(
            question.id
        );

        setQuestionText(
            question.text
        );

        setQuestionType(
            question.type
        );

        setRequired(
            question.required
        );


        // Load current saved options.
        setOptions(
            Array.isArray(
                question.options
            )
                ? question.options.map(
                    (option) => ({
                        ...option,
                    })
                )
                : []
        );


        setError("");

        setSuccessMessage("");

    }


    /* ===========================================
       Cancel Editing
    =========================================== */

    function handleCancelEdit() {

        resetQuestionForm();

        setError("");

        setSuccessMessage("");

    }


    /* ===========================================
       Delete Question
    =========================================== */

    async function handleDeleteQuestion(
        questionId
    ) {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this question?"
            );


        if (!confirmed) {

            return;

        }


        try {

            setSaving(true);

            setError("");

            setSuccessMessage("");


            await deleteQuestion(
                questionId
            );


            setQuestions(
                (
                    currentQuestions
                ) =>
                    currentQuestions.filter(
                        (
                            question
                        ) =>
                            question.id !==
                            questionId
                    )
            );


            if (
                editingQuestionId ===
                questionId
            ) {

                resetQuestionForm();

            }


            setSuccessMessage(
                "Question deleted successfully."
            );


        } catch (deleteError) {

            setError(
                deleteError.message ||
                "Failed to delete question."
            );


        } finally {

            setSaving(false);

        }

    }


    /* ===========================================
       UI
    =========================================== */

    return (

        <section className="question-builder">


            {/* Header */}

            <div className="question-builder-header">

                <div>

                    <h2>
                        Questions
                    </h2>

                    <p>
                        Add and configure the questions
                        employees will answer.
                    </p>

                </div>


                <span className="question-count">

                    {questions.length}{" "}

                    {questions.length === 1
                        ? "Question"
                        : "Questions"}

                </span>

            </div>


            {/* Survey not created */}

            {!surveyId && (

                <div className="question-builder-notice">

                    Save the survey details first to
                    start adding questions.

                </div>

            )}


            {/* Error */}

            {error && (

                <div className="question-builder-error">

                    {error}

                </div>

            )}


            {/* Success */}

            {successMessage && (

                <div className="question-builder-success">

                    {successMessage}

                </div>

            )}


            {/* Question Form */}

            {surveyId && (

                <form
                    className="question-form"
                    onSubmit={
                        handleSaveQuestion
                    }
                >


                    <h3>

                        {editingQuestionId
                            ? "Edit Question"
                            : "Add Question"}

                    </h3>


                    {/* Question Text */}

                    <div className="question-form-group">

                        <label htmlFor="question-text">

                            Question

                        </label>


                        <input
                            id="question-text"
                            type="text"
                            value={
                                questionText
                            }
                            placeholder="Enter your question"
                            maxLength={QUESTION_TEXT_MAX_LENGTH}
                            onChange={
                                (event) =>
                                    setQuestionText(
                                        removeLeadingWhitespace(event.target
                                            .value)
                                    )
                            }
                            disabled={
                                saving
                            }
                        />

                    </div>


                    <div className="question-form-row">


                        {/* Question Type */}

                        <div className="question-form-group">

                            <label htmlFor="question-type">

                                Question Type

                            </label>


                            <select
                                id="question-type"
                                value={
                                    questionType
                                }
                                onChange={
                                    handleQuestionTypeChange
                                }
                                disabled={
                                    saving
                                }
                            >

                                <option value="text">
                                    Text
                                </option>

                                <option value="textarea">
                                    Textarea
                                </option>

                                <option value="radio">
                                    Radio
                                </option>

                                {/*
                                <option value="checkbox">
                                    Checkbox
                                </option>
                                */}

                                <option value="rating">
                                    Rating
                                </option>

                                <option value="dropdown">
                                    Dropdown
                                </option>

                            </select>

                        </div>


                        {/* Required */}

                        <div className="question-required">

                            <label>

                                <input
                                    type="checkbox"
                                    checked={
                                        required
                                    }
                                    onChange={
                                        (event) =>
                                            setRequired(
                                                event
                                                    .target
                                                    .checked
                                            )
                                    }
                                    disabled={
                                        saving
                                    }
                                />

                                Required question

                            </label>

                        </div>


                    </div>


                    {/* ===================================
                        Choice Question Options
                    =================================== */}

                    {isChoiceQuestionType(
                        questionType
                    ) && (

                        <div
                            className="question-options-editor"
                            style={{
                                marginTop: "20px",
                            }}
                        >


                            <div
                                style={{
                                    display: "flex",
                                    justifyContent:
                                        "space-between",
                                    alignItems:
                                        "center",
                                    gap: "15px",
                                    marginBottom:
                                        "12px",
                                }}
                            >

                                <div>

                                    <strong>
                                        Options
                                    </strong>

                                    <p
                                        style={{
                                            margin:
                                                "4px 0 0",
                                        }}
                                    >
                                        Add the choices employees can select.
                                    </p>

                                </div>


                                <button
                                    type="button"
                                    className="secondary-btn"
                                    onClick={
                                        handleAddOption
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    + Add Option
                                </button>

                            </div>


                            {options.map(
                                (
                                    option,
                                    index
                                ) => (

                                    <div
                                        key={
                                            option.id ??
                                            `new-${index}`
                                        }
                                        className="question-option-row"
                                        style={{
                                            display:
                                                "flex",
                                            alignItems:
                                                "center",
                                            gap: "10px",
                                            marginBottom:
                                                "10px",
                                        }}
                                    >

                                        <span>
                                            {index + 1}.
                                        </span>


                                        <input
                                            type="text"
                                            maxLength={OPTION_TEXT_MAX_LENGTH}
                                            value={
                                                option
                                                    .option_text
                                            }
                                            placeholder={`Option ${index + 1}`}
                                            onChange={
                                                (
                                                    event
                                                ) =>
                                                    handleOptionChange(
                                                        index,
                                                        event
                                                            .target
                                                            .value
                                                    )
                                            }
                                            disabled={
                                                saving
                                            }
                                            style={{
                                                flex: 1,
                                            }}
                                        />


                                        <button
                                            type="button"
                                            className="secondary-btn"
                                            onClick={() =>
                                                handleRemoveOption(
                                                    index
                                                )
                                            }
                                            disabled={
                                                saving
                                            }
                                        >
                                            Remove
                                        </button>

                                    </div>

                                )
                            )}


                            {options.length === 0 && (

                                <p>
                                    No options yet. Click
                                    {" "}
                                    <strong>
                                        + Add Option
                                    </strong>
                                    {" "}
                                    to create one.
                                </p>

                            )}


                        </div>

                    )}


                    {/* Question Actions */}

                    <div className="question-form-actions">


                        {editingQuestionId && (

                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={
                                    handleCancelEdit
                                }
                                disabled={
                                    saving
                                }
                            >
                                Cancel
                            </button>

                        )}


                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={
                                saving
                            }
                        >

                            {saving
                                ? "Saving..."
                                : editingQuestionId
                                    ? "Update Question"
                                    : "+ Add Question"}

                        </button>


                    </div>


                </form>

            )}


            {/* ===========================================
                Question List
            =========================================== */}

            <div className="question-list">


                {loading ? (

                    <p>
                        Loading questions...
                    </p>

                ) : questions.length === 0 ? (

                    <div className="question-empty">

                        <h3>
                            No questions yet
                        </h3>

                        <p>
                            Add your first question above.
                        </p>

                    </div>

                ) : (

                    questions.map(
                        (
                            question,
                            index
                        ) => (

                            <div
                                className="question-item"
                                key={
                                    question.id
                                }
                            >


                                {/* Number */}

                                <div className="question-number">

                                    {index + 1}

                                </div>


                                {/* Details */}

                                <div className="question-info">


                                    <h3>
                                        {question.text}
                                    </h3>


                                    <div className="question-meta">

                                        <span>
                                            {question.type}
                                        </span>


                                        {question.required && (

                                            <span>
                                                Required
                                            </span>

                                        )}

                                    </div>


                                    {/* Saved Options */}

                                    {question.options
                                        ?.length > 0 && (

                                        <div
                                            style={{
                                                marginTop:
                                                    "10px",
                                            }}
                                        >

                                            <strong>
                                                Options:
                                            </strong>


                                            <ul
                                                style={{
                                                    margin:
                                                        "6px 0 0",
                                                    paddingLeft:
                                                        "20px",
                                                }}
                                            >

                                                {question.options.map(
                                                    (
                                                        option
                                                    ) => (

                                                        <li
                                                            key={
                                                                option.id
                                                            }
                                                        >
                                                            {
                                                                option.option_text
                                                            }
                                                        </li>

                                                    )
                                                )}

                                            </ul>

                                        </div>

                                    )}


                                </div>


                                {/* Controls */}

                                <div className="question-item-actions">


                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleEditQuestion(
                                                question
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        Edit
                                    </button>


                                    <button
                                        type="button"
                                        className="delete-question-btn"
                                        onClick={() =>
                                            handleDeleteQuestion(
                                                question.id
                                            )
                                        }
                                        disabled={
                                            saving
                                        }
                                    >
                                        Delete
                                    </button>


                                </div>


                            </div>

                        )
                    )

                )}


            </div>


        </section>

    );

}


export default QuestionBuilder;
