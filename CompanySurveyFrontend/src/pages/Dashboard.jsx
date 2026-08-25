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

                    normalizedUser?.role?.toLowerCase()
                        === "admin"
                        ? getUsers()
                        : Promise.resolve([]),

                    getSurveys(),

                    normalizedUser?.role?.toLowerCase()
                        !== "employee"
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

    }, []);


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


    // Admin controls
    const isAdmin =
        user?.role?.toLowerCase()
        === "admin";


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


                {/* Dashboard statistics */}

                <div className="cards">

                    <StatCard
                        icon={
                            <FaClipboardList />
                        }
                        title="Total Surveys"
                        value={surveyCount}
                    />

                    <StatCard
                        icon={<FaUsers />}
                        title="Employees"
                        value={userCount}
                    />

                    <StatCard
                        icon={<FaChartBar />}
                        title="Responses"
                        value={responseCount}
                    />

                    <StatCard
                        icon={
                            <FaCheckCircle />
                        }
                        title="Active Surveys"
                        value={
                            activeSurveyCount
                        }
                    />

                </div>


                {/* Dashboard heading */}

                <div className="dashboard-header">

                    <div>

                        <h1>
                            Welcome back
                        </h1>

                        <p>
                            Here's an overview of
                            your survey activity.
                        </p>

                    </div>


                    {isAdmin && (

                        <button
                            className="create-survey-btn"
                            onClick={() =>
                                navigate(
                                    "/surveys/create"
                                )
                            }
                        >
                            + Create Survey
                        </button>

                    )}

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
                                                            surveyResponses
                                                        }
                                                    </td>


                                                    {/* Actions */}

                                                    <td>

                                                        {isAdmin && (

                                                            <div className="survey-actions">


                                                                {/* VIEW - always available */}

                                                                <button
                                                                    type="button"
                                                                    title="Preview Survey"
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

                                                                        <button
                                                                            type="button"
                                                                            title="Build / Edit Survey"
                                                                            onClick={() =>
                                                                                navigate(
                                                                                    `/surveys/${survey.id}/builder`
                                                                                )
                                                                            }
                                                                        >
                                                                            <FaEdit />
                                                                        </button>


                                                                        {/* Existing analytics */}

                                                                        {surveyResponses > 0 && (

                                                                            <button
                                                                                type="button"
                                                                                title="View Analytics"
                                                                                onClick={() =>
                                                                                    navigate(
                                                                                        `/surveys/${survey.id}/analytics`
                                                                                    )
                                                                                }
                                                                            >
                                                                                <FaChartBar />
                                                                            </button>

                                                                        )}


                                                                        {/* Publish */}

                                                                        <button
                                                                            type="button"
                                                                            title="Publish Survey"
                                                                            onClick={() =>
                                                                                handlePublish(
                                                                                    survey
                                                                                )
                                                                            }
                                                                        >
                                                                            <FaPaperPlane />
                                                                        </button>

                                                                    </>

                                                                )}


                                                                {/* PUBLISHED ACTIONS */}

                                                                {survey.is_published && (

                                                                    <>

                                                                        {/* Analytics */}

                                                                        <button
                                                                            type="button"
                                                                            title="View Analytics"
                                                                            onClick={() =>
                                                                                navigate(
                                                                                    `/surveys/${survey.id}/analytics`
                                                                                )
                                                                            }
                                                                        >
                                                                            <FaChartBar />
                                                                        </button>


                                                                        {/* Copy public link */}

                                                                        <button
                                                                            type="button"
                                                                            title="Copy Public Link"
                                                                            onClick={() =>
                                                                                handleCopyLink(
                                                                                    survey.id
                                                                                )
                                                                            }
                                                                        >
                                                                            <FaLink />
                                                                        </button>


                                                                        {/* Unpublish */}

                                                                        <button
                                                                            type="button"
                                                                            title="Unpublish Survey"
                                                                            onClick={() =>
                                                                                handleUnpublish(
                                                                                    survey
                                                                                )
                                                                            }
                                                                        >
                                                                            <FaPauseCircle />
                                                                        </button>

                                                                    </>

                                                                )}


                                                                {/* Delete - always available */}

                                                                <button
                                                                    type="button"
                                                                    title="Delete Survey"
                                                                    onClick={() =>
                                                                        handleDelete(
                                                                            survey
                                                                        )
                                                                    }
                                                                >
                                                                    <FaTrash />
                                                                </button>


                                                            </div>

                                                        )}

                                                    </td>

                                                </tr>

                                            );

                                        }
                                    )}

                                </tbody>

                            </table>

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