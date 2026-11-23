import PermissionGate from "../components/PermissionGate";
import { useAuth } from "../context/useAuth";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Swal from "sweetalert2";

import "../styles/Dashboard.css";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";

import {
    FaUsers,
    FaCheckCircle,
    FaClipboardList,
    FaChartBar,
    FaEye,
    FaEdit,
    FaLink,
    FaPaperPlane,
    FaPauseCircle,
    FaTrash,
    FaShieldAlt,
    FaPlus,
} from "react-icons/fa";

import {
    getCurrentUser,
    getUsers,
    getSurveys,
    getResponses,
    publishSurvey,
    unpublishSurvey,
    deleteSurvey,
} from "../services/api";


/* Normalize API array responses */
function normalizeArrayData(payload) {

    if (Array.isArray(payload)) {
        return payload;
    }

    if (payload && Array.isArray(payload.data)) {
        return payload.data;
    }

    if (payload && Array.isArray(payload.items)) {
        return payload.items;
    }

    return [];
}


/* Normalize current user response */
function normalizeUserData(payload) {

    if (!payload || typeof payload !== "object") {
        return null;
    }

    if (
        payload.data &&
        typeof payload.data === "object"
    ) {
        return payload.data;
    }

    if (
        payload.user &&
        typeof payload.user === "object"
    ) {
        return payload.user;
    }

    return payload;
}


function Dashboard() {
    const { can, canSurvey, user: currentAccount } = useAuth();
    const accessKey = (currentAccount?.permissions || []).join(",");

    const navigate = useNavigate();

    // Logged-in user
    const [user, setUser] = useState(null);

    // Dashboard counts
    const [userCount, setUserCount] = useState(0);
    const [surveyCount, setSurveyCount] = useState(0);
    const [responseCount, setResponseCount] = useState(0);

    // Response count per survey
    const [
        surveyResponseCounts,
        setSurveyResponseCounts,
    ] = useState({});

    // Survey list
    const [surveys, setSurveys] = useState([]);

    // Loading state
    const [loading, setLoading] = useState(true);


    /* Load dashboard data */
    useEffect(() => {

        let isMounted = true;


        async function fetchDashboardData() {

            try {

                // Load current user
                const normalizedUser =
                    normalizeUserData(
                        await getCurrentUser()
                    );

                if (isMounted) {
                    setUser(normalizedUser);
                }


                // Load dashboard data
                const [
                    usersPayload,
                    surveysPayload,
                    responsesPayload,
                ] = await Promise.all([

                    normalizedUser?.permissions?.includes("user.manage")
                        ? getUsers()
                        : Promise.resolve([]),

                    getSurveys(),

                    normalizedUser?.permissions?.includes("response.view")
                        ? getResponses().catch(() => [])
                        : Promise.resolve([]),

                ]);


                const users =
                    normalizeArrayData(usersPayload);

                const surveysData =
                    normalizeArrayData(surveysPayload);

                const responses =
                    normalizeArrayData(responsesPayload);


                // One survey + submission ID = one response
                const uniqueSubmissions = new Set(
                    responses
                        .filter(
                            (response) =>
                                response.survey_id &&
                                response.submission_id
                        )
                        .map(
                            (response) =>
                                `${response.survey_id}:${response.submission_id}`
                        )
                );


                // Count submissions for each survey
                const submissionSetsBySurvey = {};

                responses.forEach((response) => {

                    const surveyId =
                        response.survey_id;

                    const submissionId =
                        response.submission_id;

                    if (
                        !surveyId ||
                        !submissionId
                    ) {
                        return;
                    }

                    if (
                        !submissionSetsBySurvey[
                            surveyId
                        ]
                    ) {
                        submissionSetsBySurvey[
                            surveyId
                        ] = new Set();
                    }

                    submissionSetsBySurvey[
                        surveyId
                    ].add(submissionId);

                });


                // Convert Sets to numeric counts
                const responseCounts = {};

                Object.entries(
                    submissionSetsBySurvey
                ).forEach(
                    ([surveyId, submissionIds]) => {

                        responseCounts[surveyId] =
                            submissionIds.size;

                    }
                );


                if (isMounted) {

                    setUserCount(users.length);

                    setSurveyCount(
                        surveysData.length
                    );

                    setResponseCount(
                        uniqueSubmissions.size
                    );

                    setSurveyResponseCounts(
                        responseCounts
                    );

                    setSurveys(
                        surveysData
                    );

                }

            } catch (error) {

                console.error(
                    "Error fetching dashboard data:",
                    error
                );

            } finally {

                if (isMounted) {
                    setLoading(false);
                }

            }

        }


        fetchDashboardData();


        return () => {
            isMounted = false;
        };

    }, [accessKey]);


    /* Publish survey */
    async function handlePublish(survey) {

        const result = await Swal.fire({
            icon: "question",
            title: "Publish Survey?",
            text:
                "The survey will become available through its public link.",
            showCancelButton: true,
            confirmButtonText: "Publish",
            cancelButtonText: "Cancel",
        });


        if (!result.isConfirmed) {
            return;
        }


        try {

            await publishSurvey(survey.id);


            // Update dashboard without reloading
            setSurveys((currentSurveys) =>
                currentSurveys.map(
                    (currentSurvey) =>
                        currentSurvey.id === survey.id
                            ? {
                                ...currentSurvey,
                                is_published: true,
                            }
                            : currentSurvey
                )
            );


            const publicUrl =
                `${window.location.origin}/surveys/${survey.id}/take`;


            await Swal.fire({
                icon: "success",
                title: "Survey Published",
                text:
                    "The survey is now live and ready to receive responses.",
                confirmButtonText: "OK",
            });


            // Copy link after publishing
            await navigator.clipboard.writeText(
                publicUrl
            );

        } catch (error) {

            console.error(
                "Error publishing survey:",
                error
            );

            await Swal.fire({
                icon: "error",
                title: "Publish Failed",
                text:
                    error.message ||
                    "Failed to publish survey.",
            });

        }

    }


    /* Unpublish survey */
    async function handleUnpublish(survey) {

        const result = await Swal.fire({
            icon: "warning",
            title: "Unpublish Survey?",
            text:
                "Employees will no longer be able to access or submit this survey.",
            showCancelButton: true,
            confirmButtonText: "Unpublish",
            cancelButtonText: "Cancel",
        });


        if (!result.isConfirmed) {
            return;
        }


        try {

            await unpublishSurvey(survey.id);


            // Update status locally
            setSurveys((currentSurveys) =>
                currentSurveys.map(
                    (currentSurvey) =>
                        currentSurvey.id === survey.id
                            ? {
                                ...currentSurvey,
                                is_published: false,
                            }
                            : currentSurvey
                )
            );


            await Swal.fire({
                icon: "success",
                title: "Survey Unpublished",
                text:
                    "The public survey is no longer available.",
                confirmButtonText: "OK",
            });

        } catch (error) {

            console.error(
                "Error unpublishing survey:",
                error
            );

            await Swal.fire({
                icon: "error",
                title: "Unpublish Failed",
                text:
                    error.message ||
                    "Failed to unpublish survey.",
            });

        }

    }


    /* Copy public survey link */
    async function handleCopyLink(surveyId) {

        const publicUrl =
            `${window.location.origin}/surveys/${surveyId}/take`;

        try {

            await navigator.clipboard.writeText(
                publicUrl
            );

            await Swal.fire({
                icon: "success",
                title: "Link Copied",
                text:
                    "The public survey link has been copied.",
                timer: 1400,
                showConfirmButton: false,
            });

        } catch (error) {

            console.error(
                "Copy link error:",
                error
            );

            await Swal.fire({
                icon: "error",
                title: "Copy Failed",
                text:
                    "Could not copy the survey link.",
            });

        }

    }


    /* Permanently delete survey */
    async function handleDelete(survey) {

        const result = await Swal.fire({
            icon: "warning",
            title: "Delete Survey?",
            html: `
                <p>
                    <strong>${survey.title}</strong>
                    will be permanently deleted.
                </p>
                <p style="margin-top:8px;">
                    Questions and responses belonging
                    to this survey will also be removed.
                </p>
            `,
            showCancelButton: true,
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            confirmButtonColor: "#dc2626",
        });


        if (!result.isConfirmed) {
            return;
        }


        try {

            await deleteSurvey(survey.id);


            const deletedResponses =
                surveyResponseCounts[
                    survey.id
                ] || 0;


            // Remove deleted survey from table
            setSurveys((currentSurveys) =>
                currentSurveys.filter(
                    (currentSurvey) =>
                        currentSurvey.id !== survey.id
                )
            );


            // Update dashboard counters
            setSurveyCount(
                (currentCount) =>
                    Math.max(
                        0,
                        currentCount - 1
                    )
            );

            setResponseCount(
                (currentCount) =>
                    Math.max(
                        0,
                        currentCount -
                        deletedResponses
                    )
            );


            setSurveyResponseCounts(
                (currentCounts) => {

                    const updatedCounts = {
                        ...currentCounts,
                    };

                    delete updatedCounts[
                        survey.id
                    ];

                    return updatedCounts;
                }
            );


            await Swal.fire({
                icon: "success",
                title: "Survey Deleted",
                text:
                    "The survey has been permanently deleted.",
                timer: 1400,
                showConfirmButton: false,
            });

        } catch (error) {

            console.error(
                "Error deleting survey:",
                error
            );

            await Swal.fire({
                icon: "error",
                title: "Delete Failed",
                text:
                    error.message ||
                    "Failed to delete survey.",
            });

        }

    }


    // Count currently published surveys
    const activeSurveyCount =
        surveys.filter(
            (survey) => survey.is_published
        ).length;





    return (

        <>

            <Sidebar />


            <div className="dashboard">


                {/* Dashboard navbar */}

                <Navbar
                    title="Dashboard"
                    userName={
                        user?.full_name ||
                        "User"
                    }
                />


                {/* Dashboard Welcome Hero Banner */}
                <div className="dashboard-hero-banner">
                    <div className="hero-banner-content">
                        <div className="hero-badge">
                            <FaShieldAlt className="hero-badge-icon" />
                            <span>Honest Town Hall • 100% Confidential Suggestion Box</span>
                        </div>
                        <h1>Welcome back, {user?.full_name || "Leader"} 👋</h1>
                        <p>Live company emotional thermometer and employee feedback overview.</p>
                    </div>

                    {can("survey.create") && (
                        <button
                            className="create-survey-btn"
                            onClick={() => navigate("/surveys/create")}
                        >
                            <FaPlus className="btn-icon" />
                            <span>Create Survey</span>
                        </button>
                    )}
                </div>

                {/* Dashboard statistics */}
                <div className="cards">
                    <StatCard
                        icon={<FaClipboardList />}
                        iconClass="icon-surveys"
                        title="Total Surveys"
                        value={surveyCount}
                        subtitle="Created across all teams"
                    />

                    <StatCard
                        icon={<FaUsers />}
                        iconClass="icon-users"
                        title="Employees"
                        value={can("user.manage") ? userCount : "?"}
                        subtitle="Eligible respondents"
                    />

                    <StatCard
                        icon={<FaChartBar />}
                        iconClass="icon-responses"
                        title="Total Responses"
                        value={can("response.view") ? responseCount : "?"}
                        subtitle="Confidential submissions"
                    />

                    <StatCard
                        icon={<FaCheckCircle />}
                        iconClass="icon-active"
                        title="Active Surveys"
                        value={activeSurveyCount}
                        subtitle="Open for feedback"
                    />
                </div>


                {/* Survey table */}

                {loading ? (

                    <p>
                        Loading dashboard...
                    </p>

                ) : (

                    <>

                        <h2>
                            Recent Surveys
                        </h2>


                        {surveys.length > 0 ? (

                            <div className="survey-table-wrapper">

                            <table className="survey-table">

                                <thead>

                                    <tr>

                                        <th>
                                            Title
                                        </th>

                                        <th>
                                            Description
                                        </th>

                                        <th>
                                            Status
                                        </th>

                                        <th>
                                            Responses
                                        </th>

                                        <th>
                                            Actions
                                        </th>

                                    </tr>

                                </thead>


                                <tbody>

                                    {surveys.map(
                                        (survey) => {

                                            const surveyResponses =
                                                surveyResponseCounts[
                                                    survey.id
                                                ] || 0;

                                            return (

                                                <tr
                                                    key={
                                                        survey.id
                                                    }
                                                >


                                                    {/* Title */}

                                                    <td>
                                                        {
                                                            survey.title
                                                        }
                                                    </td>


                                                    {/* Description */}

                                                    <td>
                                                        {
                                                            survey.description ||
                                                            "—"
                                                        }
                                                    </td>


                                                    {/* Status */}

                                                    <td>

                                                        <span
                                                            className={
                                                                survey.is_published
                                                                    ? "status-badge published"
                                                                    : "status-badge draft"
                                                            }
                                                        >
                                                            {
                                                                survey.is_published
                                                                    ? "Published"
                                                                    : "Draft"
                                                            }
                                                        </span>

                                                    </td>


                                                    {/* Responses */}

                                                    <td>
                                                        {
                                                            can("response.view") ? surveyResponses : "?"
                                                        }
                                                    </td>


                                                    {/* Actions */}

                                                    <td>

                                                        {survey.is_published && !canSurvey && (
                                                            <button onClick={() => navigate(`/surveys/${survey.id}/take`)}>Take survey</button>
                                                        )}
                                                        {canSurvey && (

                                                            <div className="survey-actions">


                                                                {/* VIEW - always available */}

                                                                <button
                                                                    type="button"
                                                                    title="Preview Survey"
                                                                    className="survey-actions-preview-btn"
                                                                    onClick={() =>
                                                                        navigate(
                                                                            `/surveys/${survey.id}/preview`
                                                                        )
                                                                    }
                                                                >
                                                                    <FaEye />
                                                                </button>


                                                                {/* DRAFT / UNPUBLISHED ACTIONS */}

                                                                {!survey.is_published && (

                                                                    <>

                                                                        {/* Build / Edit */}

                                                                        <PermissionGate permission="survey.edit"><button
                                                                            type="button"
                                                                            title="Build / Edit Survey"
                                                                            className="survey-actions-edit-btn"
                                                                            onClick={() =>
                                                                                navigate(
                                                                                    `/surveys/${survey.id}/builder`
                                                                                )
                                                                            }
                                                                        >
                                                                            <FaEdit />
                                                                        </button></PermissionGate>


                                                                        {/* Existing analytics */}

                                                                        {surveyResponses > 0 && (

                                                                            <PermissionGate permission="analytics.view"><button
                                                                                type="button"
                                                                                title="View Analytics"
                                                                                className="survey-actions-analytics-btn"
                                                                                onClick={() =>
                                                                                    navigate(
                                                                                        `/surveys/${survey.id}/analytics`
                                                                                    )
                                                                                }
                                                                            >
                                                                                <FaChartBar />
                                                                            </button></PermissionGate>

                                                                        )}


                                                                        {/* Publish */}

                                                                        <PermissionGate permission="survey.publish"><button
                                                                            type="button"
                                                                            title="Publish Survey"
                                                                            className="survey-actions-publish-btn"
                                                                            onClick={() =>
                                                                                handlePublish(
                                                                                    survey
                                                                                )
                                                                            }
                                                                        >
                                                                            <FaPaperPlane />
                                                                        </button></PermissionGate>

                                                                    </>

                                                                )}


                                                                {/* PUBLISHED ACTIONS */}

                                                                {survey.is_published && (

                                                                    <>

                                                                        {/* Analytics */}

                                                                        <PermissionGate permission="analytics.view"><button
                                                                            type="button"
                                                                            title="View Analytics"
                                                                            className="survey-actions-analytics-btn"
                                                                            onClick={() =>
                                                                                navigate(
                                                                                    `/surveys/${survey.id}/analytics`
                                                                                )
                                                                            }
                                                                        >
                                                                            <FaChartBar />
                                                                        </button></PermissionGate>


                                                                        {/* Copy public link */}

                                                                        <button
                                                                            type="button"
                                                                            title="Copy Public Link"
                                                                            className="survey-actions-copy-link-btn"
                                                                            onClick={() =>
                                                                                handleCopyLink(
                                                                                    survey.id
                                                                                )
                                                                            }
                                                                        >
                                                                            <FaLink />
                                                                        </button>


                                                                        {/* Unpublish */}

                                                                        <PermissionGate permission="survey.publish"><button
                                                                            type="button"
                                                                            title="Unpublish Survey"
                                                                            onClick={() =>
                                                                                handleUnpublish(
                                                                                    survey
                                                                                )
                                                                            }
                                                                            className="survey-actions-unpublish-btn"
                                                                        >
                                                                            <FaPauseCircle />
                                                                        </button></PermissionGate>

                                                                    </>

                                                                )}


                                                                {/* Delete - always available */}

                                                                <PermissionGate permission="survey.delete"><button
                                                                    type="button"
                                                                    title="Delete Survey"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            survey
                                                                        )
                                                                    }
                                                                    className="survey-actions-delete-btn"
                                                                >
                                                                    <FaTrash />
                                                                </button></PermissionGate>


                                                            </div>

                                                        )}

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )}

                                </tbody>

                            </table>
                            </div>

                        ) : (

                            <p className="no-data">
                                No surveys available.
                            </p>

                        )}

                    </>

                )}

            </div>

        </>

    );

}


export default Dashboard;