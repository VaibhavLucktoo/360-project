import { useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import QuestionBuilder from "../components/QuestionBuilder";

import Swal from "sweetalert2";
import { publishSurvey } from "../services/api";

import "../styles/SurveyBuilder.css";


function SurveyBuilder() {

    const { id } = useParams();

    const surveyId = Number(id);
    const navigate = useNavigate();

    

    // Track current number of questions
    const [questionCount, setQuestionCount] = useState(0);

    // Publish survey and show public link
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
            <div>
                <p>Invalid survey ID.</p>
            </div>
        );

    }


    return (

        <div className="survey-builder-page">

            <div className="survey-builder-header">

                <h1>Survey Builder</h1>

                <p>
                    Add and manage questions for your survey.
                </p>

            </div>


            {/* Question management */}
            <QuestionBuilder
                surveyId={surveyId}
                onQuestionCountChange={setQuestionCount}
            />


            <p>
                Questions: {questionCount}
            </p>
            {/* Builder actions */}
            <div className="survey-builder-actions">

                <button
                    type="button"
                    onClick={()=> navigate("/dashboard")}>
                        Save and exit
                </button>

    <           button
                    type="button"
                 onClick={() =>
                        navigate(`/surveys/${surveyId}/preview`)
                    }
                    disabled={questionCount === 0}
                >
                    Preview
                </button>
                <button
                    type="button"
                    onClick={handlePublish}
                    disabled={questionCount === 0}
                >
                    Publish
                </button>

            </div>

        </div>

    );

}


export default SurveyBuilder;