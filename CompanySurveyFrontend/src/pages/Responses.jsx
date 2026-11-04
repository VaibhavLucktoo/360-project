import { removeWhitespace } from "../utils/inputWhitespace";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    getSurvey,
    getSurveys,
    getSurveyResponses,
} from "../services/api";

import Sidebar from "../components/Sidebar";

import {
    FaArrowLeft,
    FaShieldAlt,
    FaSearch,
    FaChevronDown,
    FaChevronUp,
    FaCalendarAlt,
    FaQuestionCircle,
    FaClock,
    FaFolderOpen,
    FaCommentDots,
    FaExclamationCircle,
} from "react-icons/fa";

import "../styles/Responses.css";

function Responses() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [surveyIdInput, setSurveyIdInput] = useState("");
    const [survey, setSurvey] = useState(null);
    const [surveyList, setSurveyList] = useState([]);
    const [responses, setResponses] = useState([]);
    const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sortOrder, setSortOrder] = useState("newest");

    /* Load Survey List On /responses */
    useEffect(() => {
        if (id) return;

        let mounted = true;
        async function loadSurveys() {
            try {
                setLoading(true);
                setError("");
                const data = await getSurveys();
                if (mounted) {
                    setSurveyList(Array.isArray(data) ? data : []);
                }
            } catch (loadError) {
                if (mounted) {
                    setError(loadError.message || "Failed to load surveys.");
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadSurveys();
        return () => {
            mounted = false;
        };
    }, [id]);

    /* Load One Survey's Responses */
    useEffect(() => {
        if (!id) {
            setSurvey(null);
            setResponses([]);
            return;
        }

        let mounted = true;
        async function loadResponses() {
            try {
                setLoading(true);
                setError("");
                const [surveyData, responseData] = await Promise.all([
                    getSurvey(id),
                    getSurveyResponses(id),
                ]);

                if (mounted) {
                    setSurvey(surveyData);
                    setResponses(Array.isArray(responseData) ? responseData : []);
                }
            } catch (loadError) {
                if (mounted) {
                    setError(loadError.message || "Failed to load responses.");
                    setSurvey(null);
                    setResponses([]);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadResponses();
        return () => {
            mounted = false;
        };
    }, [id]);

    /* Group By Submission ID */
    const submissions = useMemo(() => {
        const grouped = new Map();

        responses.forEach((response) => {
            const submissionId =
                response.submission_id || `legacy-${response.id}`;

            if (!grouped.has(submissionId)) {
                grouped.set(submissionId, {
                    submission_id: submissionId,
                    answers: [],
                });
            }

            grouped.get(submissionId).answers.push(response);
        });

        const items = Array.from(grouped.values());

        items.forEach((submission) => {
            submission.answers.sort(
                (firstAnswer, secondAnswer) =>
                    firstAnswer.question_id - secondAnswer.question_id
            );
            submission.submittedAt =
                submission.answers[0]?.created_at || null;
        });

        // Give submissions stable friendly numbers
        const chronological = [...items].sort(
            (firstSubmission, secondSubmission) =>
                new Date(firstSubmission.submittedAt || 0) -
                new Date(secondSubmission.submittedAt || 0)
        );

        chronological.forEach((submission, index) => {
            submission.responseNumber = index + 1;
        });

        return [...chronological].sort(
            (firstSubmission, secondSubmission) => {
                const firstDate = new Date(firstSubmission.submittedAt || 0);
                const secondDate = new Date(secondSubmission.submittedAt || 0);

                return sortOrder === "newest"
                    ? secondDate - firstDate
                    : firstDate - secondDate;
            }
        );
    }, [responses, sortOrder]);

    const questionCount = useMemo(() => {
        return new Set(responses.map((r) => r.question_id)).size;
    }, [responses]);

    function handleSurveySearch(event) {
        event.preventDefault();
        const cleanedValue = surveyIdInput.trim();
        if (!cleanedValue) {
            setError("Enter a Survey ID.");
            return;
        }

        const surveyId = Number(cleanedValue);
        if (!Number.isInteger(surveyId) || surveyId <= 0) {
            setError("Enter a valid numerical Survey ID.");
            return;
        }

        setError("");
        navigate(`/surveys/${surveyId}/responses`);
    }

    function toggleSubmission(submissionId) {
        setExpandedSubmissionId((currentId) =>
            currentId === submissionId ? null : submissionId
        );
    }

    /* =========================================================================
       1. Landing Page (/responses)
       ========================================================================= */
    if (!id) {
        return (
            <>
                <Sidebar />

                <main className="responses-page">
                    <div className="responses-page-container">
                        <header className="responses-hero">
                            <div className="responses-header-badge">
                                <FaShieldAlt className="badge-shield" />
                                <span>Confidential Response Vault</span>
                            </div>

                            <h1>Survey Responses</h1>
                            <p>
                                Review individual anonymous submissions, audit feedback timelines, and explore employee responses without tracking identities.
                            </p>
                        </header>

                        {/* Search Panel */}
                        <section className="response-search-panel">
                            <div className="response-search-copy">
                                <h2>Direct Submission Feed</h2>
                                <p>
                                    Enter the Survey ID or choose from your active surveys below.
                                </p>
                            </div>

                            <form
                                className="response-search-form"
                                onSubmit={handleSurveySearch}
                            >
                                <div className="response-search-control">
                                    <span className="response-id-prefix">#</span>
                                    <input
                                        id="survey-id-input"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        value={surveyIdInput}
                                        placeholder="e.g. 8"
                                        onChange={(event) => {
                                            setSurveyIdInput(
                                                removeWhitespace(
                                                    event.target.value
                                                )
                                            );
                                            if (error) setError("");
                                        }}
                                    />
                                    <button type="submit" className="btn-find-responses">
                                        <FaSearch />
                                        <span>View Submissions</span>
                                    </button>
                                </div>
                            </form>
                        </section>

                        {error && (
                            <div className="responses-error-banner" role="alert">
                                <FaExclamationCircle /> {error}
                            </div>
                        )}

                        {/* Surveys Grid */}
                        <section className="responses-survey-directory">
                            <div className="responses-section-heading">
                                <div>
                                    <h2>Your Surveys</h2>
                                    <p>Select any pulse to inspect its submissions.</p>
                                </div>
                                <span className="responses-survey-count">
                                    {surveyList.length} Surveys
                                </span>
                            </div>

                            {loading ? (
                                <div className="responses-loading-box">
                                    <div className="responses-spinner"></div>
                                    <p>Loading surveys...</p>
                                </div>
                            ) : surveyList.length === 0 ? (
                                <div className="responses-empty-card">
                                    <FaFolderOpen className="empty-icon" />
                                    <h3>No Surveys Available</h3>
                                    <p>Surveys you create will appear here to review submissions.</p>
                                </div>
                            ) : (
                                <div className="response-survey-grid">
                                    {surveyList.map((item) => (
                                        <article
                                            key={item.id}
                                            className={`response-survey-card ${
                                                item.is_published
                                                    ? "card-published"
                                                    : "card-draft"
                                            }`}
                                            onClick={() =>
                                                navigate(
                                                    `/surveys/${item.id}/responses`
                                                )
                                            }
                                        >
                                            <div className="response-survey-card-top">
                                                <span className="response-survey-id">
                                                    #SURV-{item.id}
                                                </span>
                                                <span
                                                    className={`response-status ${
                                                        item.is_published
                                                            ? "published"
                                                            : "draft"
                                                    }`}
                                                >
                                                    {item.is_published && (
                                                        <span className="active-glow-dot"></span>
                                                    )}
                                                    {item.is_published
                                                        ? "Published"
                                                        : "Draft"}
                                                </span>
                                            </div>

                                            <h3>{item.title}</h3>
                                            <p>
                                                {item.description ||
                                                    "No description provided."}
                                            </p>

                                            <div className="response-card-footer">
                                                <span className="response-survey-open">
                                                    View Submissions →
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
       2. Survey Specific Responses Page (/surveys/:id/responses)
       ========================================================================= */
    if (loading) {
        return (
            <>
                <Sidebar />
                <main className="responses-page">
                    <div className="responses-page-container">
                        <div className="responses-loading-box">
                            <div className="responses-spinner"></div>
                            <h2>Decrypting Anonymous Submissions...</h2>
                            <p>Loading submission logs for Survey #{id}.</p>
                        </div>
                    </div>
                </main>
            </>
        );
    }

    return (
        <>
            <Sidebar />

            <main className="responses-page">
                <div className="responses-page-container">
                    {/* Top Nav */}
                    <div className="responses-top-nav">
                        <button
                            type="button"
                            className="responses-back-btn"
                            onClick={() => navigate("/responses")}
                        >
                            <FaArrowLeft />
                            <span>Back to Responses Hub</span>
                        </button>

                        <div className="responses-header-badge">
                            <FaShieldAlt className="badge-shield" />
                            <span>Confidential Submissions Log</span>
                        </div>
                    </div>

                    {/* Survey Header */}
                    <header className="survey-response-header">
                        <div className="survey-response-heading-row">
                            <div className="header-info-col">
                                <span className="survey-ref-pill">#SURV-{id}</span>
                                <h1>{survey?.title || `Survey #${id}`}</h1>
                                <p>
                                    Review individual anonymous submissions recorded for this survey.
                                </p>
                            </div>

                            <div className="survey-sort-control">
                                <span className="sort-label">Sort By:</span>
                                <select
                                    className="responses-sort-select"
                                    value={sortOrder}
                                    onChange={(event) =>
                                        setSortOrder(event.target.value)
                                    }
                                >
                                    <option value="newest">Newest First</option>
                                    <option value="oldest">Oldest First</option>
                                </select>
                            </div>
                        </div>
                    </header>

                    {error && (
                        <div className="responses-error-banner" role="alert">
                            <FaExclamationCircle /> {error}
                        </div>
                    )}

                    {/* Summary KPI Strip */}
                    {!error && (
                        <section className="responses-kpi-summary-grid">
                            <div className="response-kpi-card">
                                <div className="kpi-icon-well blue">
                                    <FaCommentDots />
                                </div>
                                <div className="kpi-body">
                                    <span className="kpi-label">Total Submissions</span>
                                    <strong className="kpi-value">{submissions.length}</strong>
                                    <span className="kpi-hint">Completed responses</span>
                                </div>
                            </div>

                            <div className="response-kpi-card">
                                <div className="kpi-icon-well purple">
                                    <FaQuestionCircle />
                                </div>
                                <div className="kpi-body">
                                    <span className="kpi-label">Questions</span>
                                    <strong className="kpi-value">{questionCount}</strong>
                                    <span className="kpi-hint">Answered metrics</span>
                                </div>
                            </div>

                            <div className="response-kpi-card">
                                <div className="kpi-icon-well emerald">
                                    <FaClock />
                                </div>
                                <div className="kpi-body">
                                    <span className="kpi-label">Latest Response</span>
                                    <strong className="kpi-value text-sm">
                                        {submissions.length && submissions[0].submittedAt
                                            ? new Date(submissions[0].submittedAt).toLocaleDateString()
                                            : "—"}
                                    </strong>
                                    <span className="kpi-hint">
                                        {submissions.length && submissions[0].submittedAt
                                            ? new Date(submissions[0].submittedAt).toLocaleTimeString([], {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "No submissions"}
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Empty State */}
                    {!error && submissions.length === 0 && (
                        <section className="responses-empty-card">
                            <FaFolderOpen className="empty-icon" />
                            <h2>No Submissions Yet</h2>
                            <p>
                                This survey has not received any employee responses yet. Share the public link to begin collecting confidential pulses.
                            </p>
                        </section>
                    )}

                    {/* Submissions Accordion Feed */}
                    {submissions.length > 0 && (
                        <section className="response-feed-section">
                            <div className="responses-section-heading">
                                <div>
                                    <h2>Individual Submissions</h2>
                                    <p>
                                        Click any submission to expand and audit its answers.
                                    </p>
                                </div>
                                <span className="responses-feed-count">
                                    {submissions.length} Responses
                                </span>
                            </div>

                            <div className="submission-accordion-list">
                                {submissions.map((submission) => {
                                    const isExpanded =
                                        expandedSubmissionId === submission.submission_id;

                                    return (
                                        <article
                                            key={submission.submission_id}
                                            className={`submission-card ${
                                                isExpanded ? "expanded" : ""
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                className="submission-header-btn"
                                                onClick={() =>
                                                    toggleSubmission(
                                                        submission.submission_id
                                                    )
                                                }
                                                aria-expanded={isExpanded}
                                            >
                                                <div className="submission-primary-col">
                                                    <div className="response-num-badge">
                                                        #{submission.responseNumber}
                                                    </div>

                                                    <div className="submission-title-block">
                                                        <h3>
                                                            Response #{submission.responseNumber}
                                                        </h3>
                                                        <span className="submission-date-tag">
                                                            <FaCalendarAlt className="meta-icon" />
                                                            <span>
                                                                {submission.submittedAt
                                                                    ? new Date(
                                                                          submission.submittedAt
                                                                      ).toLocaleString()
                                                                    : "Unknown time"}
                                                            </span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="submission-header-right">
                                                    <span className="answer-count-pill">
                                                        {submission.answers.length} answers
                                                    </span>

                                                    <span className="accordion-chevron">
                                                        {isExpanded ? (
                                                            <FaChevronUp />
                                                        ) : (
                                                            <FaChevronDown />
                                                        )}
                                                    </span>
                                                </div>
                                            </button>

                                            {isExpanded && (
                                                <div className="submission-content-drawer">
                                                    <div className="submission-meta-strip">
                                                        <span className="meta-label">
                                                            <FaShieldAlt className="shield-xs" />
                                                            <span>Anonymous Hash:</span>
                                                        </span>
                                                        <code className="meta-hash-code">
                                                            {submission.submission_id}
                                                        </code>
                                                    </div>

                                                    <div className="submission-answers-grid">
                                                        {submission.answers.map(
                                                            (response, index) => (
                                                                <div
                                                                    key={response.id}
                                                                    className="submission-answer-row"
                                                                >
                                                                    <div className="answer-q-header">
                                                                        <span className="ans-q-num">
                                                                            Q{index + 1}
                                                                        </span>
                                                                        <div>
                                                                            <h4>
                                                                                {response.question_text ||
                                                                                    `Question ${response.question_id}`}
                                                                            </h4>
                                                                            <span className="ans-q-type">
                                                                                {response.question_type ||
                                                                                    "question"}
                                                                            </span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="answer-response-pill">
                                                                        {response.answer_display ||
                                                                            response.answer || (
                                                                                <span className="no-ans">
                                                                                    (No answer)
                                                                                </span>
                                                                            )}
                                                                    </div>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    )}
                </div>
            </main>
        </>
    );
}

export default Responses;
