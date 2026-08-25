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

        async function loadSurveys() {

            try {

                const data = await getSurveys();

                setSurveys(
                    Array.isArray(data)
                        ? data
                        : []
                );

            } catch (error) {

                console.error(
                    "Failed to load surveys:",
                    error
                );

            } finally {

                setLoading(false);

            }

        }

        loadSurveys();

    }, []);


    // Search and status filters
    const filteredSurveys = useMemo(() => {

        return surveys.filter((survey) => {

            const matchesSearch =
                survey.title
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    ) ||
                survey.description
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );

            const matchesFilter =
                filter === "all" ||
                (
                    filter === "published" &&
                    survey.is_published
                ) ||
                (
                    filter === "draft" &&
                    !survey.is_published
                );

            return (
                matchesSearch &&
                matchesFilter
            );

        });

    }, [surveys, search, filter]);


    const publishedCount =
        surveys.filter(
            (survey) => survey.is_published
        ).length;

    const draftCount =
        surveys.length - publishedCount;


    // Publish survey
    async function handlePublish(survey) {

        const result = await Swal.fire({
            icon: "question",
            title: "Publish Survey?",
            text:
                "The public survey link will become active.",
            showCancelButton: true,
            confirmButtonText: "Publish",
        });

        if (!result.isConfirmed) {
            return;
        }

        try {

            await publishSurvey(
                survey.id
            );

            setSurveys((current) =>
                current.map((item) =>
                    item.id === survey.id
                        ? {
                            ...item,
                            is_published: true,
                        }
                        : item
                )
            );

            await Swal.fire({
                icon: "success",
                title: "Published",
                text:
                    "The survey is now live.",
                timer: 1400,
                showConfirmButton: false,
            });

        } catch (error) {

            await Swal.fire({
                icon: "error",
                title: "Publish Failed",
                text:
                    error.message ||
                    "Unable to publish survey.",
            });

        }

    }


    // Unpublish survey
    async function handleUnpublish(survey) {

        const result = await Swal.fire({
            icon: "warning",
            title: "Unpublish Survey?",
            text:
                "Employees will no longer be able to access the public survey.",
            showCancelButton: true,
            confirmButtonText: "Unpublish",
        });

        if (!result.isConfirmed) {
            return;
        }

        try {

            await unpublishSurvey(
                survey.id
            );

            setSurveys((current) =>
                current.map((item) =>
                    item.id === survey.id
                        ? {
                            ...item,
                            is_published: false,
                        }
                        : item
                )
            );

            await Swal.fire({
                icon: "success",
                title: "Unpublished",
                text:
                    "Public access has been disabled.",
                timer: 1400,
                showConfirmButton: false,
            });

        } catch (error) {

            await Swal.fire({
                icon: "error",
                title: "Unpublish Failed",
                text:
                    error.message ||
                    "Unable to unpublish survey.",
            });

        }

    }


    // Copy respondent link
    async function handleCopyLink(surveyId) {

        const url =
            `${window.location.origin}/surveys/${surveyId}/take`;

        try {

            await navigator.clipboard.writeText(
                url
            );

            await Swal.fire({
                icon: "success",
                title: "Link Copied",
                timer: 1200,
                showConfirmButton: false,
            });

        } catch {

            Swal.fire({
                icon: "error",
                title: "Copy Failed",
                text:
                    "Could not copy the survey link.",
            });

        }

    }


    return (

        <>

            <Sidebar />


            <main className="survey-list-page">

                <div className="survey-list-container">


                    {/* Header */}

                    <header className="survey-list-header">

                        <div>

                            <span className="survey-list-label">
                                Survey Management
                            </span>

                            <h1>
                                Surveys
                            </h1>

                            <p>
                                Create, manage and monitor
                                your employee surveys.
                            </p>

                        </div>


                        <button
                            className="survey-create-button"
                            onClick={() =>
                                navigate(
                                    "/surveys/create"
                                )
                            }
                        >
                            + Create Survey
                        </button>

                    </header>


                    {/* Toolbar */}

                    <div className="survey-list-toolbar">

                        <div className="survey-filter-tabs">

                            <button
                                className={
                                    filter === "all"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setFilter("all")
                                }
                            >
                                All
                                <span>
                                    {surveys.length}
                                </span>
                            </button>

                            <button
                                className={
                                    filter === "published"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setFilter(
                                        "published"
                                    )
                                }
                            >
                                Published
                                <span>
                                    {publishedCount}
                                </span>
                            </button>

                            <button
                                className={
                                    filter === "draft"
                                        ? "active"
                                        : ""
                                }
                                onClick={() =>
                                    setFilter("draft")
                                }
                            >
                                Draft
                                <span>
                                    {draftCount}
                                </span>
                            </button>

                        </div>


                        <input
                            className="survey-search"
                            type="search"
                            placeholder="Search surveys..."
                            value={search}
                            onChange={(event) =>
                                setSearch(
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    {/* Survey list */}

                    {loading ? (

                        <div className="survey-list-empty">
                            Loading surveys...
                        </div>

                    ) : filteredSurveys.length === 0 ? (

                        <div className="survey-list-empty">

                            <h3>
                                No surveys found
                            </h3>

                            <p>
                                Try another search or
                                create a new survey.
                            </p>

                        </div>

                    ) : (

                        <div className="survey-directory">

                            {filteredSurveys.map(
                                (survey) => (

                                    <article
                                        key={survey.id}
                                        className="survey-directory-card"
                                    >

                                        <div className="survey-card-content">

                                            <div className="survey-card-top">

                                                <span
                                                    className={
                                                        survey.is_published
                                                            ? "survey-status published"
                                                            : "survey-status draft"
                                                    }
                                                >
                                                    {survey.is_published
                                                        ? "Published"
                                                        : "Draft"}
                                                </span>

                                            </div>


                                            <h2>
                                                {survey.title}
                                            </h2>

                                            <p>
                                                {survey.description ||
                                                    "No description provided."}
                                            </p>

                                        </div>


                                        {/* Actions */}

                                        <div className="survey-card-actions">

                                            <button
                                                title="View"
                                                onClick={() =>
                                                    navigate(
                                                        `/surveys/${survey.id}`
                                                    )
                                                }
                                            >
                                                <FaEye />
                                                <span>View</span>
                                            </button>


                                            <button
                                                title="Build / Edit"
                                                onClick={() =>
                                                    navigate(
                                                        `/surveys/${survey.id}/builder`
                                                    )
                                                }
                                            >
                                                <FaEdit />
                                                <span>Edit</span>
                                            </button>


                                            <button
                                                title="Analytics"
                                                onClick={() =>
                                                    navigate(
                                                        `/surveys/${survey.id}/analytics`
                                                    )
                                                }
                                            >
                                                <FaChartBar />
                                                <span>Analytics</span>
                                            </button>


                                            {survey.is_published ? (

                                                <>

                                                    <button
                                                        title="Copy Link"
                                                        onClick={() =>
                                                            handleCopyLink(
                                                                survey.id
                                                            )
                                                        }
                                                    >
                                                        <FaLink />
                                                        <span>
                                                            Copy Link
                                                        </span>
                                                    </button>


                                                    <button
                                                        title="Unpublish"
                                                        onClick={() =>
                                                            handleUnpublish(
                                                                survey
                                                            )
                                                        }
                                                    >
                                                        <FaPauseCircle />
                                                        <span>
                                                            Unpublish
                                                        </span>
                                                    </button>

                                                </>

                                            ) : (

                                                <button
                                                    title="Publish"
                                                    onClick={() =>
                                                        handlePublish(
                                                            survey
                                                        )
                                                    }
                                                >
                                                    <FaPaperPlane />
                                                    <span>
                                                        Publish
                                                    </span>
                                                </button>

                                            )}

                                        </div>

                                    </article>

                                )
                            )}

                        </div>

                    )}

                </div>

            </main>

        </>

    );
}

export default SurveyList;