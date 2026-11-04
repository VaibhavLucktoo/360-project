import { removeLeadingWhitespace } from "../utils/inputWhitespace";
import PermissionGate from "../components/PermissionGate";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import Sidebar from "../components/Sidebar";

import {
    FaEye,
    FaEdit,
    FaChartBar,
    FaLink,
    FaPaperPlane,
    FaPauseCircle,
    FaPlus,
    FaSearch,
    FaTimes,
    FaShieldAlt,
    FaCalendarAlt,
    FaClipboardList,
} from "react-icons/fa";

import {
    getSurveys,
    publishSurvey,
    unpublishSurvey,
} from "../services/api";

import "../styles/SurveyList.css";

function SurveyList() {
    const navigate = useNavigate();

    const [surveys, setSurveys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("all");

    // Load surveys
    useEffect(() => {
        let isMounted = true;

        async function loadSurveys() {
            try {
                setLoading(true);
                const data = await getSurveys();

                if (isMounted) {
                    setSurveys(Array.isArray(data) ? data : []);
                }
            } catch (error) {
                console.error("Failed to load surveys:", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        }

        loadSurveys();

        return () => {
            isMounted = false;
        };
    }, []);

    // Search and status filters
    const filteredSurveys = useMemo(() => {
        const query = search.trim().toLowerCase();

        return surveys.filter((survey) => {
            const matchesSearch =
                !query ||
                survey.title?.toLowerCase().includes(query) ||
                survey.description?.toLowerCase().includes(query);

            const matchesFilter =
                filter === "all" ||
                (filter === "published" && survey.is_published) ||
                (filter === "draft" && !survey.is_published);

            return matchesSearch && matchesFilter;
        });
    }, [surveys, search, filter]);

    const publishedCount = surveys.filter((s) => s.is_published).length;
    const draftCount = surveys.length - publishedCount;

    // Publish survey
    async function handlePublish(survey) {
        const result = await Swal.fire({
            icon: "question",
            title: "Publish Survey?",
            text: "The anonymous suggestion box link will become active for employee responses.",
            showCancelButton: true,
            confirmButtonText: "Publish Now",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#10b981",
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            await publishSurvey(survey.id);

            setSurveys((current) =>
                current.map((item) =>
                    item.id === survey.id
                        ? { ...item, is_published: true }
                        : item
                )
            );

            await Swal.fire({
                icon: "success",
                title: "Survey Published",
                text: "The survey is now live and accepting confidential responses.",
                timer: 1600,
                showConfirmButton: false,
            });
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Publish Failed",
                text: error.message || "Unable to publish survey.",
            });
        }
    }

    // Unpublish survey
    async function handleUnpublish(survey) {
        const result = await Swal.fire({
            icon: "warning",
            title: "Unpublish Survey?",
            text: "Employees will no longer be able to submit responses to this survey.",
            showCancelButton: true,
            confirmButtonText: "Unpublish",
            cancelButtonText: "Keep Live",
            confirmButtonColor: "#f59e0b",
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            await unpublishSurvey(survey.id);

            setSurveys((current) =>
                current.map((item) =>
                    item.id === survey.id
                        ? { ...item, is_published: false }
                        : item
                )
            );

            await Swal.fire({
                icon: "success",
                title: "Survey Unpublished",
                text: "Public access has been paused.",
                timer: 1600,
                showConfirmButton: false,
            });
        } catch (error) {
            await Swal.fire({
                icon: "error",
                title: "Unpublish Failed",
                text: error.message || "Unable to unpublish survey.",
            });
        }
    }

    // Copy respondent link
    async function handleCopyLink(surveyId) {
        const url = `${window.location.origin}/surveys/${surveyId}/take`;

        try {
            await navigator.clipboard.writeText(url);

            await Swal.fire({
                icon: "success",
                title: "Link Copied!",
                text: "Confidential survey link copied to clipboard.",
                timer: 1400,
                showConfirmButton: false,
            });
        } catch {
            Swal.fire({
                icon: "error",
                title: "Copy Failed",
                text: "Could not copy the survey link.",
            });
        }
    }

    // Format creation date
    function formatDate(dateString) {
        if (!dateString) return "Recently created";
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        } catch {
            return "Recently created";
        }
    }

    return (
        <>
            <Sidebar />

            <main className="survey-list-page">
                <div className="survey-list-container">
                    {/* Header */}
                    <header className="survey-list-header">
                        <div className="survey-header-info">
                            <div className="survey-header-badge">
                                <FaShieldAlt className="header-badge-icon" />
                                <span>Confidential Feedback Directory</span>
                            </div>

                            <h1>Surveys</h1>

                            <p>
                                Create, launch, and monitor company-wide sentiment pulses with guaranteed anonymity.
                            </p>
                        </div>

                        <div className="survey-create-button-d">
                            <PermissionGate permission="survey.create">
                                <button
                                    className="survey-create-button"
                                    onClick={() => navigate("/surveys/create")}
                                >
                                    <FaPlus className="create-btn-icon" />
                                    <span>Create Survey</span>
                                </button>
                            </PermissionGate>
                        </div>
                    </header>

                    {/* Toolbar: Filters & Search */}
                    <div className="survey-list-toolbar">
                        <div className="survey-filter-tabs">
                            <button
                                className={`filter-tab-btn ${
                                    filter === "all" ? "active" : ""
                                }`}
                                onClick={() => setFilter("all")}
                            >
                                <span>All Surveys</span>
                                <span className="tab-counter-pill all">
                                    {surveys.length}
                                </span>
                            </button>

                            <button
                                className={`filter-tab-btn ${
                                    filter === "published" ? "active" : ""
                                }`}
                                onClick={() => setFilter("published")}
                            >
                                <span className="tab-dot published-dot"></span>
                                <span>Published</span>
                                <span className="tab-counter-pill published">
                                    {publishedCount}
                                </span>
                            </button>

                            <button
                                className={`filter-tab-btn ${
                                    filter === "draft" ? "active" : ""
                                }`}
                                onClick={() => setFilter("draft")}
                            >
                                <span className="tab-dot draft-dot"></span>
                                <span>Drafts</span>
                                <span className="tab-counter-pill draft">
                                    {draftCount}
                                </span>
                            </button>
                        </div>

                        <div className="survey-search-box">
                            <FaSearch className="search-lens-icon" />
                            <input
                                className="survey-search"
                                type="search"
                                placeholder="Search by title or description..."
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        removeLeadingWhitespace(event.target.value)
                                    )
                                }
                            />
                            {search && (
                                <button
                                    type="button"
                                    className="search-clear-btn"
                                    onClick={() => setSearch("")}
                                    title="Clear search"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Survey list */}
                    {loading ? (
                        <div className="survey-list-loading-grid">
                            {[1, 2, 3].map((skeleton) => (
                                <div
                                    key={skeleton}
                                    className="survey-skeleton-card"
                                >
                                    <div className="skeleton-line pill"></div>
                                    <div className="skeleton-line title"></div>
                                    <div className="skeleton-line desc"></div>
                                    <div className="skeleton-line desc short"></div>
                                    <div className="skeleton-actions-row">
                                        <div className="skeleton-btn"></div>
                                        <div className="skeleton-btn"></div>
                                        <div className="skeleton-btn"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredSurveys.length === 0 ? (
                        <div className="survey-list-empty">
                            <div className="empty-icon-well">
                                <FaClipboardList />
                            </div>
                            <h3>No Surveys Found</h3>
                            <p>
                                {search || filter !== "all"
                                    ? "No surveys match your current search and filter criteria."
                                    : "You haven't created any employee surveys yet. Get started with your first pulse!"}
                            </p>
                            {search || filter !== "all" ? (
                                <button
                                    type="button"
                                    className="empty-reset-btn"
                                    onClick={() => {
                                        setSearch("");
                                        setFilter("all");
                                    }}
                                >
                                    Reset Filters
                                </button>
                            ) : (
                                <PermissionGate permission="survey.create">
                                    <button
                                        type="button"
                                        className="empty-create-btn"
                                        onClick={() => navigate("/surveys/create")}
                                    >
                                        <FaPlus /> Create Your First Survey
                                    </button>
                                </PermissionGate>
                            )}
                        </div>
                    ) : (
                        <div className="survey-directory">
                            {filteredSurveys.map((survey) => (
                                <article
                                    key={survey.id}
                                    className={`survey-directory-card ${
                                        survey.is_published
                                            ? "card-published"
                                            : "card-draft"
                                    }`}
                                >
                                    <div className="survey-card-header-row">
                                        <span
                                            className={
                                                survey.is_published
                                                    ? "survey-status published"
                                                    : "survey-status draft"
                                            }
                                        >
                                            {survey.is_published && (
                                                <span className="active-glow-dot"></span>
                                            )}
                                            {survey.is_published
                                                ? "Published"
                                                : "Draft"}
                                        </span>

                                        <span className="survey-id-badge">
                                            #SURV-{survey.id}
                                        </span>
                                    </div>

                                    <div className="survey-card-content">
                                        <h2 title={survey.title}>
                                            {survey.title}
                                        </h2>

                                        <p
                                            title={
                                                survey.description ||
                                                "No description provided."
                                            }
                                        >
                                            {survey.description ||
                                                "No description provided."}
                                        </p>
                                    </div>

                                    {/* Metadata row */}
                                    <div className="survey-card-meta-row">
                                        <span className="survey-meta-item">
                                            <FaCalendarAlt className="meta-icon" />
                                            <span>
                                                {formatDate(survey.created_at)}
                                            </span>
                                        </span>

                                        {survey.is_published && (
                                            <span className="survey-live-badge">
                                                Active Link
                                            </span>
                                        )}
                                    </div>

                                    {/* Actions Toolbar */}
                                    <div className="survey-card-actions">
                                        <button
                                            className="action-btn view-btn"
                                            title="View Details"
                                            onClick={() =>
                                                navigate(`/surveys/${survey.id}`)
                                            }
                                        >
                                            <FaEye className="btn-icon" />
                                            <span>View</span>
                                        </button>

                                        <PermissionGate permission="survey.edit">
                                            <button
                                                className="action-btn edit-btn"
                                                title="Open Survey Builder"
                                                onClick={() =>
                                                    navigate(
                                                        `/surveys/${survey.id}/builder`
                                                    )
                                                }
                                            >
                                                <FaEdit className="btn-icon" />
                                                <span>Builder</span>
                                            </button>
                                        </PermissionGate>

                                        <PermissionGate permission="analytics.view">
                                            <button
                                                className="action-btn analytics-btn"
                                                title="View Analytics & Insights"
                                                onClick={() =>
                                                    navigate(
                                                        `/surveys/${survey.id}/analytics`
                                                    )
                                                }
                                            >
                                                <FaChartBar className="btn-icon" />
                                                <span>Analytics</span>
                                            </button>
                                        </PermissionGate>

                                        {survey.is_published ? (
                                            <>
                                                <button
                                                    className="action-btn copy-btn"
                                                    title="Copy Public Survey Link"
                                                    onClick={() =>
                                                        handleCopyLink(survey.id)
                                                    }
                                                >
                                                    <FaLink className="btn-icon" />
                                                    <span>Copy Link</span>
                                                </button>

                                                <PermissionGate permission="survey.publish">
                                                    <button
                                                        className="action-btn unpublish-btn"
                                                        title="Unpublish (Pause Survey)"
                                                        onClick={() =>
                                                            handleUnpublish(survey)
                                                        }
                                                    >
                                                        <FaPauseCircle className="btn-icon" />
                                                        <span>Unpublish</span>
                                                    </button>
                                                </PermissionGate>
                                            </>
                                        ) : (
                                            <PermissionGate permission="survey.publish">
                                                <button
                                                    className="action-btn publish-btn"
                                                    title="Publish Survey"
                                                    onClick={() =>
                                                        handlePublish(survey)
                                                    }
                                                >
                                                    <FaPaperPlane className="btn-icon" />
                                                    <span>Publish</span>
                                                </button>
                                            </PermissionGate>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

export default SurveyList;
