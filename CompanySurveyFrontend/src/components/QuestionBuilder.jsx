import { useEffect, useState } from "react";

import {
    createQuestion,
    deleteQuestion,
    getAdminSurveyQuestions,
    updateQuestion,
} from "../services/api";

import "../styles/QuestionBuilder.css";


/* Convert API question into UI format */
function normalizeQuestion(question) {

    return {
        id: question.id,
        text: question.question_text,
        type: question.question_type,
        required: question.is_required,
        display_order: question.display_order,
        survey_id: question.survey_id,
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


function QuestionBuilder({ surveyId,onQuestionCountChange, }) {

    // Question list
    const [questions, setQuestions] = useState([]);

    // Question form
    const [questionText, setQuestionText] = useState("");
    const [questionType, setQuestionType] = useState("text");
    const [required, setRequired] = useState(false);

    // Editing state
    const [editingQuestionId, setEditingQuestionId] =
        useState(null);

    // Request states
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Messages
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] =
        useState("");


    /* Load existing questions */
    useEffect(() => {

        let isMounted = true;


        async function fetchQuestions() {

            // Survey must exist first
            if (!surveyId) {
                return;
            }

            try {

                setLoading(true);
                setError("");

                const payload =
                    await getAdminSurveyQuestions(surveyId);

                const normalizedQuestions =
                    Array.isArray(payload?.questions)
                        ? sortQuestions(
                            payload.questions.map(
                                normalizeQuestion
                            )
                        )
                        : [];


                if (isMounted) {
                    setQuestions(normalizedQuestions);
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

    // Report current question count
useEffect(() => {

    if (onQuestionCountChange) {
        onQuestionCountChange(questions.length);
    }

}, [questions, onQuestionCountChange]);


    /* Reset question form */
    function resetQuestionForm() {

        setQuestionText("");
        setQuestionType("text");
        setRequired(false);
        setEditingQuestionId(null);

    }


    /* Add or update question */
    async function handleSaveQuestion(event) {

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


        try {

            setSaving(true);
            setError("");
            setSuccessMessage("");


            const baseQuestionPayload = {

                survey_id: surveyId,

                question_text:
                    questionText.trim(),

                question_type:
                    questionType,

                is_required:
                    required,

            };


            /* Update question */
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
                                questions.length + 1,
                        }
                    );


                setQuestions(
                    (currentQuestions) =>
                        sortQuestions(
                            currentQuestions.map(
                                (question) =>
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

                /* Create question */

                const payload =
                    await createQuestion({

                        ...baseQuestionPayload,

                        display_order:
                            questions.length + 1,

                    });


                setQuestions(
                    (currentQuestions) =>
                        sortQuestions([
                            ...currentQuestions,
                            normalizeQuestion(payload),
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


    /* Load question into form */
    function handleEditQuestion(question) {

        setEditingQuestionId(question.id);

        setQuestionText(question.text);

        setQuestionType(question.type);

        setRequired(question.required);

        setError("");

        setSuccessMessage("");

    }


    /* Cancel editing */
    function handleCancelEdit() {

        resetQuestionForm();

        setError("");
        setSuccessMessage("");

    }


    /* Delete question */
    async function handleDeleteQuestion(questionId) {

        const confirmed = window.confirm(
            "Are you sure you want to delete this question?"
        );


        if (!confirmed) {
            return;
        }


        try {

            setSaving(true);
            setError("");
            setSuccessMessage("");


            await deleteQuestion(questionId);


            setQuestions(
                (currentQuestions) =>
                    currentQuestions.filter(
                        (question) =>
                            question.id !== questionId
                    )
            );


            // Reset form if editing deleted question
            if (
                editingQuestionId === questionId
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


    return (

        <section className="question-builder">


            {/* Section heading */}

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


            {/* Question form */}

            {surveyId && (

                <form
                    className="question-form"
                    onSubmit={handleSaveQuestion}
                >


                    <h3>

                        {editingQuestionId
                            ? "Edit Question"
                            : "Add Question"}

                    </h3>


                    {/* Question text */}

                    <div className="question-form-group">

                        <label htmlFor="question-text">
                            Question
                        </label>

                        <input
                            id="question-text"
                            type="text"
                            value={questionText}
                            placeholder="Enter your question"
                            onChange={(event) =>
                                setQuestionText(
                                    event.target.value
                                )
                            }
                            disabled={saving}
                        />

                    </div>


                    <div className="question-form-row">


                        {/* Question type */}

                        <div className="question-form-group">

                            <label htmlFor="question-type">
                                Question Type
                            </label>

                            <select
                                id="question-type"
                                value={questionType}
                                onChange={(event) =>
                                    setQuestionType(
                                        event.target.value
                                    )
                                }
                                disabled={saving}
                            >

                                <option value="text">
                                    Text
                                </option>

                                <option value="radio">
                                    Radio
                                </option>

                                <option value="checkbox">
                                    Checkbox
                                </option>

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
                                    checked={required}
                                    onChange={(event) =>
                                        setRequired(
                                            event.target.checked
                                        )
                                    }
                                    disabled={saving}
                                />

                                Required question

                            </label>

                        </div>

                    </div>


                    {/* Question actions */}

                    <div className="question-form-actions">

                        {editingQuestionId && (

                            <button
                                type="button"
                                className="secondary-btn"
                                onClick={handleCancelEdit}
                                disabled={saving}
                            >
                                Cancel
                            </button>

                        )}


                        <button
                            type="submit"
                            className="primary-btn"
                            disabled={saving}
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


            {/* Question list */}

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
                        (question, index) => (

                            <div
                                className="question-item"
                                key={question.id}
                            >


                                {/* Question number */}

                                <div className="question-number">

                                    {index + 1}

                                </div>


                                {/* Question details */}

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

                                </div>


                                {/* Question controls */}

                                <div className="question-item-actions">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleEditQuestion(
                                                question
                                            )
                                        }
                                        disabled={saving}
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
                                        disabled={saving}
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