import { useEffect, useState } from "react";
import "../styles/Dashboard.css";

import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import StatCard from "../components/StatCard";

import { useNavigate } from "react-router-dom";

import {
    FaUsers,
    FaCheckCircle,
    FaClipboardList,
    FaChartBar,
    FaEye,
    FaEdit,
    FaTrash,
    FaQuestionCircle,
} from "react-icons/fa";

import {
    getCurrentUser,
    getUsers,
    getSurveys,
    getResponses,
} from "../services/api";

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

function normalizeUserData(payload) {
    if (!payload || typeof payload !== "object") {
        return null;
    }

    if (payload.data && typeof payload.data === "object") {
        return payload.data;
    }

    if (payload.user && typeof payload.user === "object") {
        return payload.user;
    }

    return payload;
}

function Dashboard() {

    const navigate = useNavigate();

    // Logged-in User
    const [user, setUser] = useState(null);

    // Dashboard Counts
    const [userCount, setUserCount] = useState(0);
    const [surveyCount, setSurveyCount] = useState(0);
    const [responseCount, setResponseCount] = useState(0);

    // Survey List
    const [surveys, setSurveys] = useState([]);

    // Loading
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        let isMounted = true;

        async function fetchDashboardData() {

            try {

                // Logged-in User
                const normalizedUser = normalizeUserData(await getCurrentUser());
                if (isMounted) setUser(normalizedUser);

                // Dashboard APIs
                const [usersPayload, surveysPayload, responsesPayload] = await Promise.all([
                    normalizedUser?.role?.toLowerCase() === "admin" ? getUsers() : Promise.resolve([]),
                    getSurveys(),
                    normalizedUser?.role?.toLowerCase() !== "employee" ? getResponses().catch(() => []) : Promise.resolve([]),
                ]);

                const users = normalizeArrayData(usersPayload);
                const surveysData = normalizeArrayData(surveysPayload);
                const responses = normalizeArrayData(responsesPayload);

                if (isMounted) {

                    setUserCount(users.length);
                    setSurveyCount(surveysData.length);
                    setResponseCount(responses.length);

                    setSurveys(surveysData);

                }

            } catch (error) {

                console.error(error);

            } finally {

                if (isMounted) {
                    setLoading(false);
                }

            }

        }
console.error(error);
        fetchDashboardData();

        return () => {
            isMounted = false;
        };

    }, []);

    const activeSurveyCount = surveys.filter((survey) => survey.is_published).length;
    const isAdmin = user?.role?.toLowerCase() === "admin";

    return (
        <>
            <Sidebar />

            <div className="dashboard">

                <Navbar />

                {/* Statistics */}
                <div className="cards">

                    <StatCard
                        icon={<FaClipboardList />}
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
                        icon={<FaCheckCircle />}
                        title="Active Surveys"
                        value={activeSurveyCount}
                    />

                </div>

                <div className="dashboard-header">

    <div>

        <h1>Dashboard</h1>

        <p>
            Welcome, {user?.full_name || "User"}
        </p>

    </div>

                    {isAdmin && <button
        className="create-survey-btn"
        onClick={() => navigate("/surveys/create")}
    >
        + Create Survey
                    </button>}

</div>
                {loading ? (

                    <p>Loading dashboard...</p>

                ) : (

                    <>
                        <h2>Recent Surveys</h2>

                        {surveys.length > 0 ? (

                            <table className="survey-table">

                                <thead>

                                    <tr>

                                        <th>Title</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th>Actions</th>

                                    </tr>

                                </thead>

                                <tbody>

                                    {surveys.map((survey) => (

                                        <tr key={survey.id}>

                                            <td>{survey.title}</td>

                                            <td>{survey.description}</td>

                                            <td>
                                                {survey.is_published
                                                    ? "Published"
                                                    : "Draft"}
                                            </td>

                                            <td>

                                                {isAdmin && <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(`/surveys/${survey.id}`)
                                                    }
                                                >
                                                    <FaEye />
                                                </button>}

                                                {isAdmin && <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(`/surveys/${survey.id}/questions`)
                                                    }
                                                >
                                                    <FaQuestionCircle />
                                                </button>}

                                                {isAdmin && <button
                                                    type="button"
                                                >
                                                    <FaEdit />
                                                </button>}

                                                <button
                                                    type="button"
                                                >
                                                    <FaTrash />
                                                </button>

                                            </td>

                                        </tr>

                                    ))}

                                </tbody>

                            </table>

                        ) : (

                            <p>No surveys available.</p>

                        )}

                    </>

                )}

            </div>

        </>
    );

}

export default Dashboard;
