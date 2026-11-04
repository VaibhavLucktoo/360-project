import { removeWhitespace } from "../utils/inputWhitespace";
import PermissionGate from "../components/PermissionGate";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getSurveyAnalytics,
    exportSurveyAnalytics,
    getSurveys,
} from "../services/api";

import RatingChart from "../components/RatingChart";
import Sidebar from "../components/Sidebar";
import Swal from "sweetalert2";

import {
    FaArrowLeft,
    FaChartBar,
    FaDownload,
    FaSearch,
    FaShieldAlt,
    FaQuestionCircle,
    FaUsers,
    FaSmile,
    FaStar,
    FaRegDotCircle,
    FaListUl,
    FaAlignLeft,
    FaCommentDots,
    FaFolderOpen,
    FaExclamationCircle,
} from "react-icons/fa";

import "../styles/Analytics.css";

function Analytics() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [data, setData] = useState(null);
    const [surveys, setSurveys] = useState([]);
    const [surveyIdInput, setSurveyIdInput] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [exporting, setExporting] = useState(false);

    /* Load surveys list for landing view */
    useEffect(() => {
        if (id) return;

        let mounted = true;
        async function fetchSurveys() {
            try {
                setLoading(true);
                setError("");
                const result = await getSurveys();
                if (mounted) {
                    setSurveys(Array.isArray(result) ? result : []);
                }
            } catch (err) {
                if (mounted) {
                    console.error("Survey Load Error:", err);
                    setError(err.message || "Failed to load surveys.");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchSurveys();
        return () => {
            mounted = false;
        };
    }, [id]);

    /* Fetch analytics for a specific survey */
    useEffect(() => {
        if (!id) return;

        let mounted = true;
        async function fetchAnalytics() {
            try {
                setLoading(true);
                setError("");
                setData(null);
                const result = await getSurveyAnalytics(id);
                if (mounted) {
                    setData(result);
                }
            } catch (err) {
                if (mounted) {
                    console.error("Analytics Load Error:", err);
                    setError(err.message || "Failed to load analytics.");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        fetchAnalytics();
        return () => {
            mounted = false;
        };
    }, [id]);

    /* Open analytics by ID */
    function handleSurveySearch(event) {
        event.preventDefault();
        const cleanedId = surveyIdInput.trim();
        if (!cleanedId) {
            setError("Enter a Survey ID.");
            return;
        }

        const surveyId = Number(cleanedId);
        if (!Number.isInteger(surveyId) || surveyId <= 0) {
            setError("Enter a valid numerical Survey ID.");
            return;
        }

        setError("");
        navigate(`/surveys/${surveyId}/analytics`);
    }

    /* Download analytics CSV */
    async function handleDownload() {
        try {
            setExporting(true);
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

            await Swal.fire({
                icon: "success",
                title: "Analytics Exported",
                text: "CSV file downloaded successfully.",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error("Analytics Download Error:", err);
            setError(err.message || "Failed to download analytics.");
        } finally {
            setExporting(false);
        }
    }

    /* Emotional thermometer mood helper */
    function getThermometerMood(avg) {
        if (avg === null || avg === undefined) return { label: "No Data", color: "#64748b", emoji: "⚪️" };
        const score = Number(avg);
        if (score >= 4.5) return { label: "Exceptional / Thriving", color: "#10b981", emoji: "🤩" };
        if (score >= 3.8) return { label: "Positive / Satisfied", color: "#6366f1", emoji: "🙂" };
        if (score >= 2.8) return { label: "Neutral / Stable", color: "#f59e0b", emoji: "😐" };
        if (score >= 2.0) return { label: "Needs Attention", color: "#f97316", emoji: "🙁" };
        return { label: "Critical / Discontent", color: "#ef4444", emoji: "😡" };
    }

    /* =========================================================================
       1. Analytics Landing Page (/analytics)
       ========================================================================= */
    if (!id) {
        return (
            <>
                <Sidebar />
                <main className="analytics-page">
                    <div className="analytics-page-container">
                        {/* Landing Header */}
                        <header className="analytics-landing-header">
                            <div className="analytics-header-badge">
                                <FaShieldAlt className="badge-shield" />
                                <span>Anonymous Sentiment Intelligence</span>
                            </div>
                            <h1>Analytics & Sentiment Hub</h1>
                            <p>
                                Explore combined employee voice trends, emotional thermometer benchmarks, and question-level breakdowns.
                            </p>
                        </header>

                        {/* Search Panel */}
                        <section className="analytics-search-panel">
                            <div className="analytics-search-info">
                                <h2>Direct Survey Lookup</h2>
                                <p>
                                    Enter a Survey ID or select from the pulses below to open detailed analytics.
                                </p>
                            </div>

                            <form
                                className="analytics-search-form"
                                onSubmit={handleSurveySearch}
                            >
                                <div className="analytics-search-control">
                                    <span className="search-hash">#</span>
                                    <input
                                        id="analytics-survey-id"
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="e.g. 8"
                                        value={surveyIdInput}
                                        onChange={(event) => {
                                            setSurveyIdInput(
                                                removeWhitespace(event.target.value)
                                            );
                                            if (error) setError("");
                                        }}
                                    />
                                    <button type="submit" className="btn-find-analytics">
                                        <FaSearch />
                                        <span>View Analytics</span>
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Error Banner */}
                        {error && (
                            <div className="analytics-error-banner" role="alert">
                                <FaExclamationCircle /> {error}
                            </div>
                        )}

                        {/* Surveys Grid */}
                        <section className="analytics-survey-directory">
                            <div className="analytics-section-heading">
                                <div>
                                    <h2>Available Surveys</h2>
                                    <p>Select any survey to review response metrics.</p>
                                </div>
                                <span className="analytics-survey-count">
                                    {surveys.length} Surveys
                                </span>
                            </div>

                            {loading ? (
                                <div className="analytics-loading-box">
                                    <div className="analytics-spinner"></div>
                                    <p>Loading surveys...</p>
                                </div>
                            ) : surveys.length === 0 ? (
                                <div className="analytics-empty-state">
                                    <FaFolderOpen className="empty-icon" />
                                    <h3>No Surveys Available</h3>
                                    <p>Create and publish a survey to start collecting sentiment data.</p>
                                </div>
                            ) : (
                                <div className="analytics-survey-grid">
                                    {surveys.map((survey) => (
                                        <article
                                            key={survey.id}
                                            className={`analytics-survey-card ${
                                                survey.is_published ? "card-published" : "card-draft"
                                            }`}
                                            onClick={() =>
                                                navigate(`/surveys/${survey.id}/analytics`)
                                            }
                                        >
                                            <div className="survey-card-top-row">
                                                <span className="analytics-card-id">
                                                    #SURV-{survey.id}
                                                </span>
                                                <span
                                                    className={`analytics-status-pill ${
                                                        survey.is_published ? "published" : "draft"
                                                    }`}
                                                >
                                                    {survey.is_published && (
                                                        <span className="active-glow-dot"></span>
                                                    )}
                                                    {survey.is_published ? "Published" : "Draft"}
                                                </span>
                                            </div>

                                            <h3>{survey.title}</h3>
                                            <p>
                                                {survey.description || "No description provided."}
                                            </p>

                                            <div className="survey-card-footer">
                                                <span className="open-analytics-cta">
                                                    <FaChartBar /> View Pulse Insights →
                                                </span>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </main>
            </>
        );
    }

    /* =========================================================================
       2. Survey-Specific Analytics Page (/surveys/:id/analytics)
       ========================================================================= */
    if (loading || !data) {
        return (
            <>
                <Sidebar />
                <main className="analytics-page">
                    <div className="analytics-page-container">
                        <div className="analytics-loading-box">
                            <div className="analytics-spinner"></div>
                            <h2>Analyzing Survey Pulses...</h2>
                            <p>Aggregating anonymous feedback and calculating distributions.</p>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    const thermoMood = getThermometerMood(data.average_rating);

    return (
        <>
            <Sidebar />

            <main className="analytics-page">
                <div className="analytics-page-container">
                    {/* Top Nav */}
                    <div className="analytics-top-nav">
                        <button
                            type="button"
                            className="analytics-back-btn"
                            onClick={() => navigate("/analytics")}
                        >
                            <FaArrowLeft />
                            <span>Back to Analytics Hub</span>
                        </button>

                        <div className="analytics-header-badge">
                            <FaShieldAlt className="badge-shield" />
                            <span>Confidential Sentiment Intelligence</span>
                        </div>
                    </div>

                    {/* Survey Header */}
                    <header className="analytics-detail-header">
                        <div className="header-info-col">
                            <span className="survey-ref-pill">#SURV-{data.survey_id}</span>
                            <h1>{data.survey_title}</h1>
                            <p>Executive emotional thermometer and question-level distribution.</p>
                        </div>

                        <div className="header-action-col">
                            <PermissionGate permission="response.export">
                                <button
                                    type="button"
                                    className="btn-download-csv"
                                    disabled={exporting}
                                    onClick={handleDownload}
                                >
                                    <FaDownload />
                                    <span>{exporting ? "Exporting..." : "Download CSV"}</span>
                                </button>
                            </PermissionGate>
                        </div>
                    </header>

                    {error && (
                        <div className="analytics-error-banner" role="alert">
                            <FaExclamationCircle /> {error}
                        </div>
                    )}

                    {/* Executive KPI Summary Cards */}
                    <section className="analytics-kpi-summary-grid">
                        <div className="kpi-stat-card">
                            <div className="stat-card-icon blue">
                                <FaUsers />
                            </div>
                            <div className="stat-card-body">
                                <span className="stat-label">Total Submissions</span>
                                <strong className="stat-value">{data.total_responses}</strong>
                                <span className="stat-hint">Anonymous responses</span>
                            </div>
                        </div>

                        <div className="kpi-stat-card">
                            <div className="stat-card-icon purple">
                                <FaQuestionCircle />
                            </div>
                            <div className="stat-card-body">
                                <span className="stat-label">Questions</span>
                                <strong className="stat-value">
                                    {data.questions?.length || 0}
                                </strong>
                                <span className="stat-hint">Active metrics</span>
                            </div>
                        </div>

                        <div className="kpi-stat-card thermo-card">
                            <div className="stat-card-icon orange">
                                <FaSmile />
                            </div>
                            <div className="stat-card-body">
                                <span className="stat-label">Emotional Thermometer</span>
                                <div className="thermo-score-row">
                                    <strong className="stat-value">
                                        {data.average_rating !== null
                                            ? `${data.average_rating}`
                                            : "—"}
                                    </strong>
                                    {data.average_rating !== null && (
                                        <span className="stat-max">/ 5.0</span>
                                    )}
                                </div>
                                <span
                                    className="thermo-mood-tag"
                                    style={{ color: thermoMood.color }}
                                >
                                    {thermoMood.emoji} {thermoMood.label}
                                </span>
                            </div>
                        </div>

                        <div className="kpi-stat-card">
                            <div className="stat-card-icon emerald">
                                <FaShieldAlt />
                            </div>
                            <div className="stat-card-body">
                                <span className="stat-label">Survey State</span>
                                <div className="state-badge-row">
                                    <span
                                        className={`survey-status-tag ${
                                            data.is_published ? "published" : "draft"
                                        }`}
                                    >
                                        {data.is_published && (
                                            <span className="active-glow-dot"></span>
                                        )}
                                        {data.is_published ? "Published" : "Draft"}
                                    </span>
                                </div>
                                <span className="stat-hint">
                                    {data.is_published
                                        ? "Accepting public pulses"
                                        : "Draft mode only"}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* Privacy Guarantee Banner */}
                    <div className="analytics-privacy-banner">
                        <FaShieldAlt className="shield-icon" />
                        <div>
                            <strong>Aggregated Confidentiality Guarantee:</strong>
                            <span> All responses are stripped of employee identifiers and aggregated to safeguard participant trust.</span>
                        </div>
                    </div>

                    {/* Question Analytics Stream */}
                    <section className="analytics-questions-section">
                        <div className="analytics-section-heading">
                            <div>
                                <h2>Question-Level Insights</h2>
                                <p>Detailed sentiment breakdown and feedback distributions.</p>
                            </div>
                        </div>

                        {data.questions?.length === 0 ? (
                            <div className="analytics-empty-state">
                                <h3>No Question Analytics Available</h3>
                                <p>This survey has no active questions to evaluate.</p>
                            </div>
                        ) : (
                            <div className="analytics-questions-stream">
                                {data.questions.map((question, index) => {
                                    const questionType =
                                        (question.question_type || "").toLowerCase();
                                    const isChoiceQuestion = ["radio", "dropdown"].includes(
                                        questionType
                                    );
                                    const isTextQuestion = ["text", "textarea"].includes(
                                        questionType
                                    );

                                    return (
                                        <article
                                            key={question.question_id || index}
                                            className="analytics-question-card"
                                        >
                                            {/* Question Card Header */}
                                            <div className="q-card-header">
                                                <div className="q-index-pill">
                                                    #{index + 1}
                                                </div>

                                                <div className="q-header-content">
                                                    <h3>{question.question}</h3>
                                                    <div className="q-meta-row">
                                                        <span className="q-type-badge">
                                                            {questionType === "rating" && (
                                                                <FaStar className="badge-icon star" />
                                                            )}
                                                            {questionType === "radio" && (
                                                                <FaRegDotCircle className="badge-icon" />
                                                            )}
                                                            {questionType === "dropdown" && (
                                                                <FaListUl className="badge-icon" />
                                                            )}
                                                            {isTextQuestion && (
                                                                <FaAlignLeft className="badge-icon" />
                                                            )}
                                                            <span>
                                                                {questionType === "rating"
                                                                    ? "Rating Scale"
                                                                    : questionType === "radio"
                                                                    ? "Multiple Choice"
                                                                    : questionType === "dropdown"
                                                                    ? "Dropdown"
                                                                    : "Open Feedback"}
                                                            </span>
                                                        </span>

                                                        <span className="q-response-count">
                                                            {question.total_responses} responses
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* 1. Rating Question Analytics */}
                                            {questionType === "rating" && (
                                                <div className="q-analytics-zone rating-zone">
                                                    <div className="rating-avg-score-well">
                                                        <span className="avg-label">Average Score</span>
                                                        {question.average_rating !== null ? (
                                                            <div className="avg-score-display">
                                                                <strong className="score-num">
                                                                    {question.average_rating}
                                                                </strong>
                                                                <span className="score-out-of">/ 5.0</span>
                                                                <span className="star-rating-indicator">
                                                                    {"★".repeat(Math.round(question.average_rating || 0))}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="no-pulse-data">
                                                                No ratings collected yet
                                                            </span>
                                                        )}
                                                    </div>

                                                    {question.rating_distribution && (
                                                        <RatingChart
                                                            distribution={
                                                                question.rating_distribution
                                                            }
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* 2. Multiple Choice Analytics */}
                                            {isChoiceQuestion && (
                                                <div className="q-analytics-zone choice-zone">
                                                    {question.answer_breakdown &&
                                                    Object.keys(question.answer_breakdown).length > 0 ? (
                                                        <div className="choice-breakdown-list">
                                                            {Object.entries(
                                                                question.answer_breakdown
                                                            ).map(([option, count]) => {
                                                                const pct =
                                                                    question.total_responses > 0
                                                                        ? Math.round(
                                                                              (count /
                                                                                  question.total_responses) *
                                                                                  100
                                                                          )
                                                                        : 0;

                                                                return (
                                                                    <div
                                                                        key={option}
                                                                        className="choice-bar-item"
                                                                    >
                                                                        <div className="choice-bar-labels">
                                                                            <span className="choice-title">
                                                                                {option}
                                                                            </span>
                                                                            <span className="choice-votes">
                                                                                <strong>{count}</strong> ({pct}%)
                                                                            </span>
                                                                        </div>
                                                                        <div className="choice-track">
                                                                            <div
                                                                                className="choice-fill"
                                                                                style={{
                                                                                    width: `${pct}%`,
                                                                                }}
                                                                            ></div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <p className="no-pulse-data">
                                                            No choice selections recorded yet.
                                                        </p>
                                                    )}
                                                </div>
                                            )}

                                            {/* 3. Open Feedback (Text / Textarea) */}
                                            {isTextQuestion && (
                                                <div className="q-analytics-zone text-zone">
                                                    {question.text_responses &&
                                                    question.text_responses.length > 0 ? (
                                                        <div className="text-feedback-grid">
                                                            {question.text_responses.map(
                                                                (resp, rIdx) => (
                                                                    <div
                                                                        key={rIdx}
                                                                        className="feedback-quote-card"
                                                                    >
                                                                        <div className="quote-header">
                                                                            <FaCommentDots className="quote-icon" />
                                                                            <span className="quote-num">
                                                                                Feedback #{rIdx + 1}
                                                                            </span>
                                                                        </div>
                                                                        <p className="quote-body">
                                                                            "{resp}"
                                                                        </p>
                                                                    </div>
                                                                )
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <p className="no-pulse-data">
                                                            No qualitative feedback submitted yet.
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                </div>
            </main>
        </>
    );
}

export default Analytics;
