import { useParams } from "react-router-dom";

import QuestionBuilder from "../components/QuestionBuilder";


function SurveyQuestions() {

    const { id } = useParams();

    const surveyId = Number(id);


    // Validate survey ID from the route
    if (!surveyId) {

        return (
            <div>
                <p>Invalid survey ID.</p>
            </div>
        );

    }


    return (

        <div className="survey-questions-page">

            {/* Reuse the shared question builder */}
            <QuestionBuilder surveyId={surveyId} />

        </div>

    );

}


export default SurveyQuestions;


{/*import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    createQuestion,
    deleteQuestion,
    getSurveyQuestions,
    updateQuestion,
} from "../services/api";
import { useSurvey } from "../context/SurveyContext";

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

function sortQuestions(questions) {

    return [...questions].sort((firstQuestion, secondQuestion) => {
        return (firstQuestion.display_order || 0) - (secondQuestion.display_order || 0);
    });

}

function SurveyQuestions() {

    const { id } = useParams();

    const surveyId = Number(id);

    const { questions, setQuestions, setActiveSurveyId } = useSurvey();

    const [questionText, setQuestionText] = useState("");

    const [questionType, setQuestionType] = useState("text");

    const [required, setRequired] = useState(false);

    const [editingQuestionId, setEditingQuestionId] = useState(null);

    const [loading, setLoading] = useState(true);

    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");

    const [successMessage, setSuccessMessage] = useState("");

    const navigate = useNavigate();

    useEffect(() => {

        let isMounted = true;

        async function fetchQuestions() {

            try {

                setLoading(true);
                setError("");

                const payload = await getSurveyQuestions(surveyId);

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

        if (surveyId) {
            setActiveSurveyId(surveyId);
            fetchQuestions();
        } else {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setLoading(false);
        }

        return () => {
            isMounted = false;
        };

    }, [surveyId, setActiveSurveyId, setQuestions]);

    async function handleAddQuestion(e) {
        e.preventDefault();

        if (!questionText.trim()) {
            setError("Question cannot be empty.");
            return;
        }

        try {

            setSaving(true);
            setError("");
            setSuccessMessage("");

            const baseQuestionPayload = {
                survey_id: surveyId,
                question_text: questionText.trim(),
                question_type: questionType,
                is_required: required,
            };

            if (editingQuestionId) {

                const existingQuestion = questions.find((question) => question.id === editingQuestionId);

                const payload = await updateQuestion(editingQuestionId, {
                    ...baseQuestionPayload,
                    display_order: existingQuestion?.display_order || (questions.reduce((max, q) => Math.max(max, q.display_order || 0), 0) + 1),
                });


                setQuestions((currentQuestions) =>
                    sortQuestions(
                        currentQuestions.map((question) =>
                            question.id === editingQuestionId
                                ? normalizeQuestion(payload)
                                : question
                        )
                    )
                );

                setSuccessMessage("Question updated successfully.");
                setEditingQuestionId(null);

            } else {

                const payload = await createQuestion({
                    ...baseQuestionPayload,
                    display_order: questions.reduce((max, q) => Math.max(max, q.display_order || 0), 0) + 1,
                });


                setQuestions((currentQuestions) =>
                    sortQuestions([
                        ...currentQuestions,
                        normalizeQuestion(payload),
                    ])
                );

                setSuccessMessage("Question saved successfully.");

            }

            setQuestionText("");
            setQuestionType("text");
            setRequired(false);

        } catch (saveError) {

            setError(saveError.message || "Failed to save question.");

        } finally {

            setSaving(false);

        }

    }

    async function handleDeleteQuestion(questionId) {

        try {

            setSaving(true);
            setError("");
            setSuccessMessage("");

            await deleteQuestion(questionId);

            setQuestions((currentQuestions) =>
                currentQuestions.filter((question) => question.id !== questionId)
            );

            setSuccessMessage("Question deleted successfully.");

            if (editingQuestionId === questionId) {
                setEditingQuestionId(null);
                setQuestionText("");
                setQuestionType("text");
                setRequired(false);
            }

        } catch (deleteError) {

            setError(deleteError.message || "Failed to delete question.");

        } finally {

            setSaving(false);

        }

    }

    function handleEditQuestion(question) {

        setEditingQuestionId(question.id);
        setQuestionText(question.text);
        setQuestionType(question.type);
        setRequired(question.required);
        setError("");
        setSuccessMessage("");

    }

    function handleCancelEdit() {

        setEditingQuestionId(null);
        setQuestionText("");
        setQuestionType("text");
        setRequired(false);
        setError("");

    }

    return (

        <div style={{ padding: "30px" }}>

            <h1>Survey Questions</h1>

            <p>Survey ID: {id}</p>

            {error && <p style={{ color: "#b00020" }}>{error}</p>}

            {successMessage && <p style={{ color: "#0a7b34" }}>{successMessage}</p>}

            <hr />

            <h2>{editingQuestionId ? "Edit Question" : "Add Question"}</h2>

            <form onSubmit={handleAddQuestion}>

                <div>
                    <label>Question</label>
                    <br />
                    <input
                        type="text"
                        value={questionText}
                        onChange={(e) => setQuestionText(e.target.value)}
                        placeholder="Enter question"
                    />
                </div>

                <br />

                <div>
                    <label>Question Type</label>
                    <br />

                    <select
                        value={questionType}
                        onChange={(e) => setQuestionType(e.target.value)}
                    >
                        <option value="text">Text</option>
                        <option value="radio">Radio</option>
                        <option value="checkbox">Checkbox</option>
                        <option value="rating">Rating</option>
                        <option value="dropdown">Dropdown</option>
                    </select>

                </div>

                <br />

                <label>

                    <input
                        type="checkbox"
                        checked={required}
                        onChange={(e) => setRequired(e.target.checked)}
                    />

                    Required

                </label>

                <br /><br />

                <button type="submit" disabled={saving}>

                    {saving ? "Saving..." : editingQuestionId ? "Update Question" : "Add Question"}

                </button>

                {editingQuestionId && (
                    <button
                        type="button"
                        style={{ marginLeft: "10px" }}
                        onClick={handleCancelEdit}
                        disabled={saving}
                    >
                        Cancel
                    </button>
                )}

            </form>

            <hr />

            <h2>Questions</h2>

            {loading ? (
                <p>Loading questions...</p>
            ) : questions.length === 0 ? (
                <p>No questions added yet.</p>
            ) : (
                questions.map((question, index) => (
                    <div
                        key={question.id}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: "8px",
                            padding: "15px",
                            marginBottom: "15px",
                            background: "#fff",
                        }}
                    >
                        <h3>Question {index + 1}</h3>

                        <p>
                            <strong>Question:</strong> {question.text}
                        </p>

                        <p>
                            <strong>Type:</strong> {question.type}
                        </p>

                        <p>
                            <strong>Required:</strong> {question.required ? "Yes" : "No"}

                        </p>

                        <div style={{ marginTop: "15px" }}>
                            <button
                                type="button"
                                onClick={() => handleEditQuestion(question)}
                                disabled={saving}
                            >
                                ✏ Edit
                            </button>

                            <button
                                type="button"
                                style={{ marginLeft: "10px" }}
                                onClick={() => handleDeleteQuestion(question.id)}
                                disabled={saving}
                            >
                                🗑 Delete
                            </button>
                        </div>

                    </div>
                ))
            )}

            <button
                type="button"
                onClick={() => navigate(`/surveys/${id}/preview`)}
                disabled={saving}
            >
                Preview Survey
            </button>

        </div>

    );

}

export default SurveyQuestions;*/}
