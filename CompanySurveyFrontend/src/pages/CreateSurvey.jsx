import { removeLeadingWhitespace } from "../utils/inputWhitespace";
import PermissionGate from "../components/PermissionGate";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { createSurvey } from "../services/api";
import Sidebar from "../components/Sidebar";
import {
    FaArrowLeft,
    FaArrowRight,
    FaSave,
    FaShieldAlt,
    FaExclamationCircle,
} from "react-icons/fa";

import "../styles/CreateSurvey.css";

const TITLE_MAX_LENGTH = 200;
const TITLE_MAX_WORDS = 20;
const DESCRIPTION_MAX_LENGTH = 5000;
const DESCRIPTION_MAX_WORDS = 300;

function countWords(value) {
    return value.trim().split(/\s+/).filter(Boolean).length;
}

function CreateSurvey() {
    const navigate = useNavigate();

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const titleWords = countWords(title);
    const descWords = countWords(description);
    const isTitleOver = titleWords > TITLE_MAX_WORDS;
    const isDescOver = descWords > DESCRIPTION_MAX_WORDS;

    // Create the initial survey draft
    async function createDraft() {
        if (!title.trim() || !description.trim()) {
            setError("Title and description are required.");
            return null;
        }

        if (isTitleOver) {
            setError(`Survey title cannot exceed ${TITLE_MAX_WORDS} words.`);
            return null;
        }

        if (isDescOver) {
            setError(`Survey description cannot exceed ${DESCRIPTION_MAX_WORDS} words.`);
            return null;
        }

        try {
            setLoading(true);
            setError("");

            const survey = await createSurvey({
                title: title.trim(),
                description: description.trim(),
            });

            return survey.id;
        } catch (err) {
            console.error("Create Survey Error:", err);
            setError(err.message || "Failed to create survey.");
            return null;
        } finally {
            setLoading(false);
        }
    }

    // Save the draft and return to surveys list
    async function handleSaveDraft() {
        const surveyId = await createDraft();
        if (!surveyId) return;

        await Swal.fire({
            icon: "success",
            title: "Draft Saved",
            text: "Your survey has been saved as a draft.",
            timer: 1400,
            showConfirmButton: false,
        });

        navigate("/surveys");
    }

    // Create the draft and continue to the builder
    async function handleBuildSurvey() {
        const surveyId = await createDraft();
        if (!surveyId) return;

        navigate(`/surveys/${surveyId}/builder`);
    }

    function handleCancel() {
        navigate("/surveys");
    }

    return (
        <>
            <Sidebar />

            <main className="create-survey-page">
                <div className="create-survey-container">
                    {/* Header */}
                    <header className="create-survey-header">
                        <div className="create-header-top-row">
                            <button
                                type="button"
                                className="create-back-btn"
                                onClick={() => navigate("/surveys")}
                            >
                                <FaArrowLeft className="back-btn-icon" />
                                <span>Back to Surveys</span>
                            </button>

                            <div className="create-survey-badge">
                                <FaShieldAlt className="badge-shield" />
                                <span>Anonymous Suggestion Box • Setup</span>
                            </div>
                        </div>

                        <h1>Create a New Survey</h1>
                        <p>
                            Configure the survey title and purpose. You will add questions, rating scales, and customize anonymity rules on the next step.
                        </p>
                    </header>

                    {/* Survey Form Card */}
                    <div className="create-survey-card">
                        {error && (
                            <div className="create-survey-error" role="alert">
                                <FaExclamationCircle className="error-icon" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                handleBuildSurvey();
                            }}
                        >
                            {/* Survey Title Field */}
                            <div className="create-form-group">
                                <div className="form-label-row">
                                    <label htmlFor="survey-title">
                                        Survey Title <span className="req-star">*</span>
                                    </label>
                                    <span
                                        className={`word-counter-pill ${
                                            isTitleOver ? "counter-overflow" : ""
                                        }`}
                                    >
                                        {titleWords} / {TITLE_MAX_WORDS} words
                                    </span>
                                </div>

                                <input
                                    id="survey-title"
                                    type="text"
                                    className="create-form-input"
                                    placeholder="e.g. Q4 Team Experience & Culture Pulse"
                                    maxLength={TITLE_MAX_LENGTH}
                                    value={title}
                                    onChange={(event) => {
                                        setTitle(
                                            removeLeadingWhitespace(
                                                event.target.value
                                            )
                                        );
                                        setError("");
                                    }}
                                    disabled={loading}
                                    autoFocus
                                />
                                <span className="input-field-hint">
                                    Keep it clear and concise so employees immediately know what they are rating.
                                </span>
                            </div>

                            {/* Description Field */}
                            <div className="create-form-group">
                                <div className="form-label-row">
                                    <label htmlFor="survey-description">
                                        Confidentiality Brief & Description <span className="req-star">*</span>
                                    </label>
                                    <span
                                        className={`word-counter-pill ${
                                            isDescOver ? "counter-overflow" : ""
                                        }`}
                                    >
                                        {descWords} / {DESCRIPTION_MAX_WORDS} words
                                    </span>
                                </div>

                                <textarea
                                    id="survey-description"
                                    className="create-form-textarea"
                                    rows="5"
                                    placeholder="Explain the purpose of this survey, reassure employees that responses are 100% anonymous, and outline how the feedback will drive team improvements..."
                                    maxLength={DESCRIPTION_MAX_LENGTH}
                                    value={description}
                                    onChange={(event) => {
                                        setDescription(
                                            removeLeadingWhitespace(
                                                event.target.value
                                            )
                                        );
                                        setError("");
                                    }}
                                    disabled={loading}
                                />
                                <span className="input-field-hint">
                                    This text is displayed on the respondent taking page before any questions appear.
                                </span>
                            </div>

                            {/* Actions Toolbar */}
                            <div className="create-survey-actions">
                                <button
                                    type="button"
                                    className="create-action-btn cancel-btn"
                                    onClick={handleCancel}
                                    disabled={loading}
                                >
                                    Cancel
                                </button>

                                <div className="create-actions-right">
                                    <button
                                        type="button"
                                        className="create-action-btn draft-btn"
                                        onClick={handleSaveDraft}
                                        disabled={loading || !title.trim()}
                                    >
                                        <FaSave />
                                        <span>
                                            {loading ? "Saving..." : "Save Draft"}
                                        </span>
                                    </button>

                                    <PermissionGate permission="survey.edit">
                                        <button
                                            type="submit"
                                            className="create-action-btn build-btn"
                                            disabled={loading || !title.trim()}
                                        >
                                            <span>
                                                {loading
                                                    ? "Creating..."
                                                    : "Continue to Builder"}
                                            </span>
                                            <FaArrowRight />
                                        </button>
                                    </PermissionGate>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );
}

export default CreateSurvey;
