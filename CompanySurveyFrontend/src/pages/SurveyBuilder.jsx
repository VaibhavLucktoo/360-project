import PermissionGate from "../components/PermissionGate";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import QuestionBuilder from "../components/QuestionBuilder";
import Sidebar from "../components/Sidebar";
import { publishSurvey } from "../services/api";

import "../styles/SurveyBuilder.css";


function SurveyBuilder() {

    const { id } = useParams();

    const surveyId = Number(id);

    const navigate = useNavigate();


    // Track the number of questions in this survey.
    const [questionCount, setQuestionCount] = useState(0);


    /* ===========================================
       Publish Survey
    =========================================== */

    async function handlePublish() {

        // Prevent publishing an empty survey.
        if (questionCount === 0) {

            await Swal.fire({
                icon: "warning",
                title: "No Questions Added",
                text: "Add at least one question before publishing.",
            });

            return;
        }


        // Ask the admin to confirm publishing.
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

            // Publish the survey through the backend.
            await publishSurvey(surveyId);


            // Build the public employee survey URL.
            const publicUrl =
                `${window.location.origin}/surveys/${surveyId}/take`;


            const publishResult = await Swal.fire({
                icon: "success",
                title: "Survey Published",
                html: `
                    <p>Your survey is now live.</p>

                    <input
                        class="swal2-input"
                        value="${publicUrl}"
                        readonly
                    />
                `,
                showCancelButton: true,
                confirmButtonText: "Copy Link",
                cancelButtonText: "Done",
            });


            // Copy public survey link.
            if (publishResult.isConfirmed) {

                await navigator.clipboard.writeText(
                    publicUrl
                );


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
                text:
                    error.message ||
                    "Failed to publish survey.",
            });

        }

    }


    /* ===========================================
       Invalid Survey
    =========================================== */

    if (!surveyId) {

        return (

            <div>

                <p>
                    Invalid survey ID.
                </p>

            </div>

        );

    }


    /* ===========================================
       Builder UI
    =========================================== */

    return (

        <>
            <Sidebar />

            <main className="survey-builder-page">


            {/* Header */}

            <div className="survey-builder-header">

                <h1>
                    Survey Builder
                </h1>

                <p>
                    Add and manage questions for your survey.
                </p>

            </div>


            {/* Question management */}

            <QuestionBuilder
                surveyId={surveyId}
                onQuestionCountChange={
                    setQuestionCount
                }
            />


            {/* Question count */}

            <p>
                Questions: {questionCount}
            </p>


            {/* Builder actions */}

            <div className="survey-builder-actions">


                {/* Save and exit */}

                <button
                    type="button"
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    Save and Exit
                </button>


                {/* Preview */}

                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            `/surveys/${surveyId}/preview`
                        )
                    }
                    disabled={
                        questionCount === 0
                    }
                >
                    Preview
                </button>


                {/* Publish */}

                <PermissionGate permission="survey.publish"><button
                    type="button"
                    onClick={handlePublish}
                    disabled={
                        questionCount === 0
                    }
                >
                    Publish
                </button></PermissionGate>


            </div>


            </main>
        </>

    );

}


export default SurveyBuilder;
