import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import {
    getSurveyAnalytics,
    exportSurveyAnalytics,
} from "../services/api";

import "../styles/Analytics.css";
import RatingChart from "../components/RatingChart";

function Analytics() {

    const { id } = useParams();

    const [data, setData] = useState(null);
    const [error, setError] = useState("");


    // ===========================================
    // Download Survey Analytics
    // ===========================================

    async function handleDownload() {

        try {

            setError("");

            const blob = await exportSurveyAnalytics(id);

            const url = window.URL.createObjectURL(blob);

            const link = document.createElement("a");

            link.href = url;

            link.download = `survey-${id}-analytics.csv`;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);

        } catch (err) {

            console.error("Analytics Download Error:", err);

            setError(
                err.message || "Failed to download analytics."
            );

        }

    }


    // ===========================================
    // Fetch Survey Analytics
    // ===========================================

    useEffect(() => {

        async function fetchAnalytics() {

            try {

                setError("");

                const result = await getSurveyAnalytics(id);

                setData(result);

            } catch (err) {

                console.error("Analytics Load Error:", err);

                setError(
                    err.message || "Failed to load analytics."
                );

            }

        }

        fetchAnalytics();

    }, [id]);


    // ===========================================
    // Error State
    // ===========================================

    if (error) {

        return (

            <div className="analytics-page">

                <p className="error">
                    {error}
                </p>

            </div>

        );

    }


    // ===========================================
    // Loading State
    // ===========================================

    if (!data) {

        return (

            <div className="analytics-page">

                <p>Loading analytics...</p>

            </div>

        );

    }


    // ===========================================
    // UI
    // ===========================================

    return (

        <div className="analytics-page">

            {/* Back Navigation */}

            <Link to={`/surveys/${id}`}>
                ← Back to Survey
            </Link>


            {/* Page Title */}

            <h1>
                {data.survey_title} — Analytics
            </h1>


            {/* ===========================================
                Survey Summary
            =========================================== */}

            <div className="analytics-summary">

                {/* Total Submissions */}

                <div className="summary-card">

                    <span className="summary-label">
                        Anonymous Submissions
                    </span>

                    <strong className="summary-value">
                        {data.total_responses}
                    </strong>

                </div>


                {/* Survey Status */}

                <div className="summary-card">

                    <span className="summary-label">
                        Survey Status
                    </span>

                    <strong className="summary-value">

                        {data.is_published
                            ? "Published"
                            : "Draft"}

                    </strong>

                </div>


                {/* Overall Average */}

                <div className="summary-card">

                    <span className="summary-label">
                        Overall Average Rating
                    </span>

                    <strong className="summary-value">

                        {data.average_rating !== null
                            ? `${data.average_rating} / 5`
                            : "No responses yet"}

                    </strong>

                </div>

            </div>


            {/* Privacy Message */}

            <p className="privacy-note">

                Individual responses are displayed only in aggregate
                to protect respondent privacy.

            </p>


            <hr />


            {/* ===========================================
                Question Analytics
            =========================================== */}

            <h2>Question Analytics</h2>


            {data.questions.length === 0 ? (

                <p>No questions available.</p>

            ) : (

                data.questions.map((question, index) => (

                    <div
                        key={index}
                        className="question-card"
                    >

                        {/* Question */}

                        <h3>
                            {question.question}
                        </h3>


                        {/* Question Type */}

                        <p>
                            <strong>Type:</strong>{" "}
                            {question.question_type}
                        </p>


                        {/* Response Count */}

                        <p>
                            <strong>Total Responses:</strong>{" "}
                            {question.total_responses}
                        </p>


                        {/* ===========================================
                            Rating Analytics
                        =========================================== */}

                        {question.question_type === "rating" && (

    <div className="rating-result">

        <span className="rating-label">
            Average Rating
        </span>


        {question.average_rating !== null ? (

            <>
                <strong className="rating-value">

                    {question.average_rating}

                    <span className="rating-max">
                        {" "} / 5
                    </span>

                </strong>


                <RatingChart
                    distribution={question.rating_distribution}
                />
            </>

        ) : (

            <span className="no-responses">
                No responses yet
            </span>

        )}

    </div>

)}           

                        {/* ===========================================
                            Text Feedback
                        =========================================== */}

                        {question.question_type === "text" && (

                            <div className="feedback-section">

                                <strong>
                                    Responses:
                                </strong>


                                {question.text_responses &&
                                question.text_responses.length > 0 ? (

                                    <div className="feedback-list">

                                        {question.text_responses.map(
                                            (response, responseIndex) => (

                                                <div
                                                    key={responseIndex}
                                                    className="feedback-card"
                                                >
                                                    {response}
                                                </div>

                                            )
                                        )}

                                    </div>

                                ) : (

                                    <p className="no-responses">
                                        No responses yet.
                                    </p>

                                )}

                            </div>

                        )}

                    </div>

                ))

            )}


            {/* ===========================================
                Download Analytics
            =========================================== */}

            <div className="analytics-actions">

                <button
                    type="button"
                    onClick={handleDownload}
                    className="download-analytics-btn"
                >
                    Download Analytics CSV
                </button>

            </div>

        </div>

    );

}


export default Analytics;