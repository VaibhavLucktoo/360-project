import PermissionGate from "../components/PermissionGate";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { FaArrowLeft, FaEye, FaPaperPlane, FaTools } from "react-icons/fa";

import QuestionBuilder from "../components/QuestionBuilder";
import Sidebar from "../components/Sidebar";
import { publishSurvey } from "../services/api";

import "../styles/SurveyBuilder.css";

function SurveyBuilder() {
    const { id } = useParams();
    const surveyId = Number(id);
    const navigate = useNavigate();

    // Track question count
    const [questionCount, setQuestionCount] = useState(0);

    /* ===========================================
       Publish Survey
    =========================================== */
    async function handlePublish() {
        if (questionCount === 0) {
            await Swal.fire({
                icon: "warning",
                title: "No Questions Added",
                text: "Add at least one question before publishing.",
            });
            return;
        }

        const result = await Swal.fire({
            icon: "question",
            title: "Publish Survey?",
            text: "The survey will become available through the public link.",
            showCancelButton: true,
            confirmButtonText: "Publish",
            cancelButtonText: "Cancel",
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            await publishSurvey(surveyId);
            const publicUrl = `${window.location.origin}/surveys/${surveyId}/take`;

            const publishResult = await Swal.fire({
                icon: "success",
                title: "Survey Published",
                html: `
                    <p style="margin-bottom: 12px; color: #475569;">Your survey is now live for anonymous submissions.</p>
                    <input
                        class="swal2-input"
                        value="${publicUrl}"
                        readonly
                        style="width: 100%; box-sizing: border-box;"
                    />
                `,
                showCancelButton: true,
                confirmButtonText: "Copy Link",
                cancelButtonText: "Done",
            });

            if (publishResult.isConfirmed) {
                await navigator.clipboard.writeText(publicUrl);
                await Swal.fire({
                    icon: "success",
                    title: "Link Copied",
                    timer: 1200,
                    showConfirmButton: false,
                });
            }
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Publish Failed",
                text: error.message || "Failed to publish survey.",
            });
        }
    }

    if (!surveyId) {
        return (
            <div className="survey-builder-invalid">
                <p>Invalid survey ID.</p>
            </div>
        );
    }

    return (
        <>
            <Sidebar />

            <main className="survey-builder-page">
                {/* Header Card */}
                <div className="survey-builder-header">
                    <div className="builder-header-left">
                        <div className="builder-badge">
                            <FaTools className="builder-badge-icon" />
                            <span>Suggestion Box Architect • Question Designer</span>
                        </div>
                        <h1>Survey Builder</h1>
                        <p>
                            Design clear, honest questions to capture your team's emotional temperature.
                        </p>
                    </div>

                    <div className="builder-header-badge">
                        <span className="builder-counter-pill">
                            📝 {questionCount} {questionCount === 1 ? "Question" : "Questions"}
                        </span>
                    </div>
                </div>

                {/* Question management */}
                <QuestionBuilder
                    surveyId={surveyId}
                    onQuestionCountChange={setQuestionCount}
                />

                {/* Bottom Actions Bar */}
                <div className="survey-builder-actions">
                    <button
                        type="button"
                        className="builder-btn-exit"
                        onClick={() => navigate("/dashboard")}
                    >
                        <FaArrowLeft className="btn-icon" />
                        <span>Save & Exit</span>
                    </button>

                    <button
                        type="button"
                        className="builder-btn-preview"
                        onClick={() => navigate(`/surveys/${surveyId}/preview`)}
                        disabled={questionCount === 0}
                    >
                        <FaEye className="btn-icon" />
                        <span>Preview Survey</span>
                    </button>

                    <PermissionGate permission="survey.publish">
                        <button
                            type="button"
                            className="builder-btn-publish"
                            onClick={handlePublish}
                            disabled={questionCount === 0}
                        >
                            <FaPaperPlane className="btn-icon" />
                            <span>Publish Survey</span>
                        </button>
                    </PermissionGate>
                </div>
            </main>
        </>
    );
}

export default SurveyBuilder;
