import { useAuth } from "../context/useAuth";
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { getSurvey, exportSurveyAnalytics } from "../services/api";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

import {
    FaArrowLeft,
    FaShieldAlt,
    FaEdit,
    FaEye,
    FaChartBar,
    FaComments,
    FaDownload,
    FaLink,
    FaCalendarAlt,
    FaQuestionCircle,
    FaExternalLinkAlt,
    FaExclamationCircle,
} from "react-icons/fa";

import "../styles/SurveyDetails.css";

function SurveyDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
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

            await Swal.fire({
                icon: "success",
                title: "Responses Exported",
                text: "CSV file has been downloaded successfully.",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err) {
            setError(err.message || "Failed to export responses.");
        } finally {
            setExporting(false);
        }
    }

    async function handleCopyPublicLink() {
        const publicUrl = `${window.location.origin}/surveys/${id}/take`;
        try {
            await navigator.clipboard.writeText(publicUrl);
            await Swal.fire({
                icon: "success",
                title: "Link Copied!",
                text: "Confidential respondent link copied to clipboard.",
                timer: 1400,
                showConfirmButton: false,
            });
        } catch {
            Swal.fire({
                icon: "error",
                title: "Copy Failed",
                text: "Could not copy the link.",
            });
        }
    }

    function formatDate(dateString) {
        if (!dateString) return "Recently created";
        try {
            return new Date(dateString).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return "Recently created";
        }
    }

    useEffect(() => {
        let isMounted = true;

        async function fetchSurvey() {
            try {
                setLoading(true);
                const surveyData = await getSurvey(id);
                if (isMounted) {
                    setSurvey(surveyData);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) {
                    setError("Failed to load survey details.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        fetchSurvey();

        return () => {
            isMounted = false;
        };
    }, [id]);

    if (loading) {
        return (
            <>
                <Sidebar />
                <main className="survey-details-page">
                    <div className="survey-details-container">
                        <div className="details-loading-card">
                            <div className="details-loader-spin"></div>
                            <h2>Loading Survey Details...</h2>
                            <p>Fetching anonymous suggestion box configuration.</p>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    if (!survey) {
        return (
            <>
                <Sidebar />
                <main className="survey-details-page">
                    <div className="survey-details-container">
                        <section className="survey-details-card error-card">
                            <Link to="/surveys" className="survey-details-back-btn">
                                <FaArrowLeft /> Back to Surveys
                            </Link>
                            <div className="details-not-found">
                                <FaExclamationCircle className="not-found-icon" />
                                <h2>Survey Not Found</h2>
                                <p>The requested survey does not exist or has been removed.</p>
                            </div>
                        </section>
                    </div>
                </main>
            </>
        );
    }

    const publicTakeUrl = `${window.location.origin}/surveys/${id}/take`;
    const questionCount = Array.isArray(survey.questions)
        ? survey.questions.length
        : 0;

    return (
        <>
            <Sidebar />

            <main className="survey-details-page">
                <div className="survey-details-container">
                    {/* Top Navigation Row */}
                    <div className="details-top-nav">
                        <button
                            type="button"
                            className="survey-details-back-btn"
                            onClick={() => navigate("/surveys")}
                        >
                            <FaArrowLeft />
                            <span>Back to Surveys</span>
                        </button>

                        <div className="details-confidential-badge">
                            <FaShieldAlt className="shield-icon" />
                            <span>Confidential Pulse Hub</span>
                        </div>
                    </div>

                    {/* Main Overview Card */}
                    <section className="survey-details-card">
                        <div className="details-card-header">
                            <div>
                                <span className="survey-details-ref">
                                    #SURV-{id}
                                </span>
                                <h1>{survey.title}</h1>
                                <p>{survey.description || "No description provided."}</p>
                            </div>

                            <span
                                className={`survey-details-status ${
                                    survey.is_published ? "published" : "draft"
                                }`}
                            >
                                {survey.is_published && (
                                    <span className="active-glow-dot"></span>
                                )}
                                {survey.is_published ? "Published" : "Draft"}
                            </span>
                        </div>

                        {/* Survey Stats / Metadata Strip */}
                        <div className="details-kpi-grid">
                            <div className="details-kpi-card">
                                <span className="kpi-icon-well blue">
                                    <FaQuestionCircle />
                                </span>
                                <div>
                                    <span className="kpi-label">Questions</span>
                                    <strong className="kpi-value">
                                        {questionCount}
                                    </strong>
                                </div>
                            </div>

                            <div className="details-kpi-card">
                                <span className="kpi-icon-well purple">
                                    <FaCalendarAlt />
                                </span>
                                <div>
                                    <span className="kpi-label">Created Date</span>
                                    <strong className="kpi-value text-sm">
                                        {formatDate(survey.created_at)}
                                    </strong>
                                </div>
                            </div>

                            <div className="details-kpi-card">
                                <span className="kpi-icon-well emerald">
                                    <FaShieldAlt />
                                </span>
                                <div>
                                    <span className="kpi-label">Privacy Protocol</span>
                                    <strong className="kpi-value text-sm">
                                        100% Anonymous
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* Public Link Box (if published) */}
                        {survey.is_published && (
                            <div className="details-public-link-box">
                                <div className="link-box-left">
                                    <span className="link-pulse-dot"></span>
                                    <div>
                                        <span className="link-box-title">
                                            Public Respondent Link
                                        </span>
                                        <code className="link-box-url">
                                            {publicTakeUrl}
                                        </code>
                                    </div>
                                </div>

                                <div className="link-box-actions">
                                    <button
                                        type="button"
                                        className="btn-copy-url"
                                        onClick={handleCopyPublicLink}
                                    >
                                        <FaLink /> Copy Link
                                    </button>
                                    <Link
                                        to={`/surveys/${id}/take`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-visit-url"
                                    >
                                        <FaExternalLinkAlt /> Open
                                    </Link>
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="details-error-alert" role="alert">
                                <FaExclamationCircle /> {error}
                            </div>
                        )}

                        {/* Action Hub */}
                        <div className="survey-details-actions">
                            {can("survey.edit") && (
                                <Link
                                    to={`/surveys/${id}/builder`}
                                    className="details-hub-btn builder-btn"
                                >
                                    <FaEdit className="hub-icon" />
                                    <span>Manage Questions & Builder</span>
                                </Link>
                            )}

                            {canSurvey && (
                                <Link
                                    to={`/surveys/${id}/preview`}
                                    className="details-hub-btn preview-btn"
                                >
                                    <FaEye className="hub-icon" />
                                    <span>Preview Survey</span>
                                </Link>
                            )}

                            {can("analytics.view") && (
                                <Link
                                    to={`/surveys/${id}/analytics`}
                                    className="details-hub-btn analytics-btn"
                                >
                                    <FaChartBar className="hub-icon" />
                                    <span>View Analytics</span>
                                </Link>
                            )}

                            {can("response.view") && (
                                <Link
                                    to={`/surveys/${id}/responses`}
                                    className="details-hub-btn responses-btn"
                                >
                                    <FaComments className="hub-icon" />
                                    <span>View Responses</span>
                                </Link>
                            )}

                            {can("response.export") && (
                                <button
                                    type="button"
                                    className="details-hub-btn export-btn"
                                    disabled={exporting}
                                    onClick={downloadResponses}
                                >
                                    <FaDownload className="hub-icon" />
                                    <span>
                                        {exporting
                                            ? "Exporting..."
                                            : "Export CSV"}
                                    </span>
                                </button>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}

export default SurveyDetails;
