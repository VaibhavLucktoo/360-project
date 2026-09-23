import { removeLeadingWhitespace } from "../utils/inputWhitespace";
import PermissionGate from "../components/PermissionGate";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";

import {
    createSurvey,
} from "../services/api";

import Sidebar from "../components/Sidebar";

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


    // Create the initial survey draft
    async function createDraft() {

        if (!title.trim() || !description.trim()) {

            setError(
                "Title and description are required."
            );

            return null;
        }

        if (countWords(title) > TITLE_MAX_WORDS) {

            setError(
                `Survey title cannot exceed ${TITLE_MAX_WORDS} words.`
            );

            return null;
        }

        if (countWords(description) > DESCRIPTION_MAX_WORDS) {

            setError(
                `Survey description cannot exceed ${DESCRIPTION_MAX_WORDS} words.`
            );

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

        } catch (error) {

            console.error(
                "Create Survey Error:",
                error
            );

            setError(
                error.message ||
                "Failed to create survey."
            );

            return null;

        } finally {

            setLoading(false);

        }

    }


    // Save the draft and return to dashboard
    async function handleSaveDraft() {

        const surveyId = await createDraft();

        if (!surveyId) {
            return;
        }

        await Swal.fire({
            icon: "success",
            title: "Draft Saved",
            text: "Your survey has been saved as a draft.",
            confirmButtonText: "OK",
        });

        navigate("/dashboard");
    }


    // Create the draft and continue to the builder
    async function handleBuildSurvey() {

        const surveyId = await createDraft();

        if (!surveyId) {
            return;
        }

        navigate(
            `/surveys/${surveyId}/builder`
        );
    }


    // Leave without creating a survey
    function handleCancel() {

        navigate("/dashboard");
    }


    return (

        <>
            <Sidebar />

            <main className="create-survey-page">

            <div className="create-survey-container">


                {/* Page Header */}

                <div className="create-survey-header">

                    <span className="create-survey-label">
                        Survey Management
                    </span>

                    <h1>
                        Create Survey
                    </h1>

                    <p>
                        Start with the basic survey details.
                        You can add questions and publish it
                        from the survey builder.
                    </p>

                    <div>
                        <button
                    type="button"
                    className="dashboard-back-btn-createsurvey-page"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                    >

                    Back to Dashboard

                    </button>
                    </div>

                </div>


                {/* Survey Form */}

                <div className="create-survey-card">

                    {error && (

                        <div className="create-survey-error">
                            {error}
                        </div>

                    )}


                    <div className="form-group">

                        <label htmlFor="survey-title">
                            Survey Title
                        </label>

                        <input
                            id="survey-title"
                            type="text"
                            placeholder="e.g. Employee Satisfaction Survey"
                            maxLength={TITLE_MAX_LENGTH}
                            value={title}
                            onChange={(event) => {
                                setTitle(removeLeadingWhitespace(event.target.value));
                                setError("");
                            }}
                            disabled={loading}
                            autoFocus
                        />

                    </div>


                    <div className="form-group">

                        <label htmlFor="survey-description">
                            Description
                        </label>

                        <textarea
                            id="survey-description"
                            rows="5"
                            placeholder="Briefly explain the purpose of this survey..."
                            maxLength={DESCRIPTION_MAX_LENGTH}
                            value={description}
                            onChange={(event) => {
                                setDescription(removeLeadingWhitespace(event.target.value));
                                setError("");
                            }}
                            disabled={loading}
                        />

                    </div>


                    {/* Actions */}

                    <div className="create-survey-actions">

                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            className="secondary-btn"
                            onClick={handleSaveDraft}
                            disabled={loading}
                        >
                            {loading
                                ? "Saving..."
                                : "Save Draft"}
                        </button>

                        <PermissionGate permission="survey.edit"><button
                            type="button"
                            className="primary-btn"
                            onClick={handleBuildSurvey}
                            disabled={loading}
                        >
                            {loading
                                ? "Creating..."
                                : "Build Survey"}
                        </button></PermissionGate>

                    </div>

                </div>

            </div>

            </main>
        </>

    );
}


export default CreateSurvey;
