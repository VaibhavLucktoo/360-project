import { useAuth } from "../context/useAuth";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getSurvey, exportSurveyAnalytics } from "../services/api";
import Sidebar from "../components/Sidebar";

import "../styles/SurveyDetails.css";

function SurveyDetails() {
    const { id } = useParams();
    const [survey, setSurvey] = useState(null);
    const [loading, setLoading] = useState(true);
    const { can, canSurvey } = useAuth();
    const [exporting, setExporting] = useState(false);
    const [error, setError] = useState("");

    async function downloadResponses() {
        setExporting(true);
        setError("");
        try {
            const blob = await exportSurveyAnalytics(id);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `survey-${id}-responses.csv`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
        } catch (err) {
            setError(err.message);
        } finally {
            setExporting(false);
        }
    }

    useEffect(() => {
        async function fetchSurvey() {
            try {
                const surveyData = await getSurvey(id);
                setSurvey(surveyData);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        }

        fetchSurvey();
    }, [id]);

    if (loading) {
        return (
            <>
                <Sidebar />

                <main className="survey-details-page">
                    <section className="survey-details-card">
                        <h1>Survey Details</h1>
                        <p>Loading...</p>
                    </section>
                </main>
            </>
        );
    }

    if (!survey) {
        return (
            <>
                <Sidebar />

                <main className="survey-details-page">
                    <section className="survey-details-card">
                        <Link
                            to="/surveys"
                            className="survey-details-back"
                        >
                            Back to Surveys
                        </Link>

                        <h1>Survey Details</h1>
                        <p>Survey not found.</p>
                    </section>
                </main>
            </>
        );
    }

    return (
        <>
            <Sidebar />

            <main className="survey-details-page">
                <section className="survey-details-card">
                    <Link
                        to="/surveys"
                        className="survey-details-back"
                    >
                        Back to Surveys
                    </Link>

                    <span className="survey-details-label">
                        Survey #{id}
                    </span>

                    <div className="survey-details-heading">
                        <div>
                            <h1>{survey.title}</h1>
                            <p>{survey.description}</p>
                        </div>

                        <span
                            className={
                                survey.is_published
                                    ? "survey-details-status published"
                                    : "survey-details-status draft"
                            }
                        >
                            {survey.is_published ? "Published" : "Draft"}
                        </span>
                    </div>

                    {error && <p role="alert">{error}</p>}
                    <div className="survey-details-actions">
                        {can("response.export") && <button disabled={exporting} onClick={downloadResponses}>{exporting ? "Exporting..." : "Export responses"}</button>}

                        {can("survey.edit") && <Link to={`/surveys/${id}/builder`}>Manage Survey</Link>}
                        {canSurvey && <Link to={`/surveys/${id}/preview`}>Preview</Link>}
                        {can("analytics.view") && <Link to={`/surveys/${id}/analytics`}>View Analytics</Link>}
                        {can("response.view") && <Link to={`/surveys/${id}/responses`}>View Responses</Link>}
                        {survey.is_published && <Link to={`/surveys/${id}/take`}>Take Survey</Link>}
                    </div>
                </section>
            </main>
        </>
    );
}

export default SurveyDetails;

